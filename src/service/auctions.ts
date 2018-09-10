import { MergedValue, getTotalCount, getQuartile } from "../utils";
import { getRepository } from "typeorm";
import { Region, getAuctionDataStatus, getAuctionData } from "./wowapi";
import { Realm } from "../entity/Realm";
import { Auction } from "../entity/Auction";

export class Auctions {
    private lastUpdates = new Map<number, Date>();

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

    private async updateAuctionData(realm: Realm) {
        const statusList = await getAuctionDataStatus(realm);
        const lastUpdate = this.lastUpdates.get(realm.id);
        const first = statusList[0];
        if (!lastUpdate || lastUpdate.getTime() < first.lastModified.getDate()) {
            for (const status of statusList) {
                const data = await getAuctionData(realm.name, status.url);

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
                await Auctions.storeAuctionData(realm.id, map);
            }
            this.lastUpdates.set(realm.id, first.lastModified);
        }
    }

    async updateAll() {
        const realms = await getRepository(Realm).find();
        for (const i of realms) {
            try {
                await this.updateAuctionData(i);
            } catch (error) {
                console.debug("Auctions#updateAll", error, new Date());
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