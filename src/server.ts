import "reflect-metadata";
import { createConnection, getRepository } from "typeorm";
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from "./secrets";
import { Realm } from "./entity/Realm";
import { Auction } from "./entity/Auction";
import { Recipes } from "./recipes";
import { getAuctionDataStatus, Region, getAuctionData } from "./wowapi";

async function storeRealm(region: Region, realm: string): Promise<number> {
    const repository = getRepository(Realm);
    const result = await repository.findOne({ region: region, name: realm });
    if (result) {
        return result.id;
    }
    const newRealm = repository.create({ region: region, name: realm });
    return (await repository.save(newRealm)).id;
}

type AuctionItem = {
    buyout: number,
    quantity: number
};

export function getQuartile(values: AuctionItem[], totalQuantity: number) {
    // TODO Test this function and see if its off by one etc
    const first = totalQuantity / 4;
    const second = totalQuantity / 2;
    let sum = 0;
    let i = 0;
    for (; sum < first; i++) {
        sum += values[i].quantity;
    }
    const firstQuartile = values[i - 1].buyout / values[i - 1].quantity;

    for (; sum < second; i++) {
        sum += values[i].quantity;
    }
    const secondQuartile = values[i - 1].buyout / values[i - 1].quantity;

    return {
        first: firstQuartile,
        second: secondQuartile
    };
}

async function storeAuctionData(realmId: number, data: Map<number, AuctionItem[]>) {
    const repository = getRepository(Auction);
    for (const [id, values] of data) {
        values.sort((a, b) => (a.buyout / a.quantity) - (b.buyout / b.quantity));
        const lowestPrice = values[0].buyout / values[0].quantity;
        const totalQuantity = values.reduce((sum, i) => sum + i.quantity, 0);
        const quartile = getQuartile(values, totalQuantity);

        const auction = repository.create({
            realmId: realmId,
            id: id,
            lowestPrice: lowestPrice,
            firstQuartile: quartile.first,
            secondQuartile: quartile.second,
            quantity: totalQuantity
        });
        await repository.save(auction);
    }
}

async function updateAuctionData(region: Region, realm: string) {
    const status = await getAuctionDataStatus(region, realm);
    const realmId = await storeRealm(region, realm);
    for (const i of status) {
        const data = await getAuctionData(realm, i.url);

        // Merge items
        const map = new Map<number, AuctionItem[]>();
        for (const i of data) {
            const value = map.get(i.item);
            if (value) {
                value.push(i);
            } else {
                map.set(i.item, [i]);
            }
        }
        await storeAuctionData(realmId, map);
    }
}

async function start() {
    await createConnection({
        type: "mysql",
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        entities: [Realm, Auction],
        synchronize: true,
        logging: false
    });
    const recipes = new Recipes();
    if (recipes.empty()) {
        await recipes.update();
    } else {
        console.info("Using existing recipes");
    }
    await updateAuctionData(Region.EU, "draenor");
    // TODO Get all items
}

start().then(() => {
    console.info("Started");
}).catch(error => {
    console.error("Error from start", error);
});
