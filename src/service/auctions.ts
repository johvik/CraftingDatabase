import { MergedValue, getTotalCount, getQuartile } from "../utils";
import { getRepository } from "typeorm";
import { Region, getAuctionDataStatus, getAuctionData } from "./wowapi";
import { Realm } from "../entity/Realm";
import { Auction } from "../entity/Auction";

export class Auctions {
    static async storeRealm(region: Region, realm: string): Promise<number> {
        const name = realm.toLowerCase();
        const repository = getRepository(Realm);
        const result = await repository.findOne({ region: region, name: name });
        if (result) {
            return result.id;
        }
        const newRealm = repository.create({ region: region, name: name });
        return (await repository.save(newRealm)).id;
    }

    private static async storeAuctionData(realmId: number, data: Map<number, MergedValue[]>) {
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

    private static async updateAuctionData(region: Region, realm: string) {
        const status = await getAuctionDataStatus(region, realm);
        const realmId = await Auctions.storeRealm(region, realm);
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
            await Auctions.storeAuctionData(realmId, map);
        }
    }

    static async updateAll() {
        const realms = await getRepository(Realm).find();
        for (const i of realms) {
            try {
                await Auctions.updateAuctionData(i.region, i.name);
            } catch (error) {
                console.debug("Auctions#updateAll", error);
            }
        }
    }

    static async items(): Promise<Set<number>> {
        const ids = await getRepository(Auction)
            .createQueryBuilder("auction")
            .select("DISTINCT auction.id")
            .getRawMany();
        return new Set<number>(ids.map(id => id.id));
    }
}
