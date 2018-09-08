import "reflect-metadata";
import { createConnection, getRepository } from "typeorm";
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from "./secrets";
import { Realm } from "./entity/Realm";
import { Auction } from "./entity/Auction";
import { Recipes } from "./recipes";
import { getAuctionDataStatus, Region, getAuctionData } from "./wowapi";
import { getQuartile, MergedValue, getTotalCount } from "./utils";

async function storeRealm(region: Region, realm: string): Promise<number> {
    const repository = getRepository(Realm);
    const result = await repository.findOne({ region: region, name: realm });
    if (result) {
        return result.id;
    }
    const newRealm = repository.create({ region: region, name: realm });
    return (await repository.save(newRealm)).id;
}

async function storeAuctionData(realmId: number, data: Map<number, MergedValue[]>) {
    const repository = getRepository(Auction);
    for (const [id, values] of data) {
        values.sort((a, b) => a.value - b.value);
        const lowestPrice = values[0].value;
        const totalCount = getTotalCount(values);
        const quartile = getQuartile(values, totalCount);

        const auction = repository.create({
            realmId: realmId,
            id: id,
            lowestPrice: lowestPrice,
            firstQuartile: quartile.first,
            secondQuartile: quartile.second,
            quantity: totalCount
        });
        await repository.save(auction);
    }
}

async function updateAuctionData(region: Region, realm: string) {
    const status = await getAuctionDataStatus(region, realm);
    const realmId = await storeRealm(region, realm);
    for (const i of status) {
        const data = await getAuctionData(realm, i.url);

        // Merge items with the same id
        const map = new Map<number, MergedValue[]>();
        for (const i of data) {
            const value = map.get(i.item);
            const mergedValue = { value: i.buyout / i.quantity, count: i.quantity };
            if (value) {
                value.push(mergedValue);
            } else {
                map.set(i.item, [mergedValue]);
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
    // TODO Get the name etc of all items
}

start().then(() => {
    console.info("Started");
}).catch(error => {
    console.error("Error from start", error);
});
