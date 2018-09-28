import { MergedValue, getTotalCount, getQuartile } from "../utils";
import { getRepository } from "typeorm";
import { Region, getAuctionDataStatus, getAuctionData } from "./wowapi";
import { Realm } from "../entity/Realm";
import { Auction } from "../entity/Auction";

type LastUpdateInfo = {
    lastAttempt: Date,
    lastModified: Date,
    cache: string
};

export class Auctions {
    private updating = false;
    private lastUpdates = new Map<number, LastUpdateInfo>();

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

    private static async storeAuctionData(realmId: number, lastModified: Date, data: Map<number, MergedValue[]>) {
        const repository = getRepository(Auction);
        const auctions: Auction[] = [];
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
                quantity: totalCount,
                lastUpdate: lastModified
            });
            auctions.push(auction);
        }
        await repository.save(auctions, { chunk: Math.max(1, Math.ceil(auctions.length / 1000)) });
    }

    private async updateAuctionData(realm: Realm) {
        const statusList = await getAuctionDataStatus(realm);
        const lastUpdate = this.lastUpdates.get(realm.id);
        const first = statusList[0];
        if (!lastUpdate || lastUpdate.lastModified.getTime() < first.lastModified.getTime()) {
            for (const status of statusList) {
                const data = await getAuctionData(realm.name, status.url);

                // Merge items with the same id
                const map = new Map<number, MergedValue[]>();
                for (const i of data) {
                    if (i.buyout !== 0) { // Skip items without a buyout
                        const value = map.get(i.item);
                        const mergedValue = { value: i.buyout / i.quantity, count: i.quantity };
                        if (value) {
                            value.push(mergedValue);
                        } else {
                            map.set(i.item, [mergedValue]);
                        }
                    }
                }
                await Auctions.storeAuctionData(realm.id, first.lastModified, map);
            }
            this.lastUpdates.set(realm.id, {
                lastAttempt: new Date(),
                lastModified: first.lastModified,
                cache: ""
            });
        } else if (lastUpdate) {
            lastUpdate.lastAttempt = new Date();
        }
    }

    async updateAll() {
        if (this.updating) {
            console.log("Auctions#updateAll", "already updating", new Date());
        } else {
            this.updating = true;
            const realms = await getRepository(Realm).find();
            for (const i of realms) {
                try {
                    await this.updateAuctionData(i);
                } catch (error) {
                    console.debug("Auctions#updateAll", error, new Date());
                }
            }
            this.updating = false;
        }
    }

    async json(realmId: number): Promise<string> {
        // TODO Only get recipe items?
        const lastUpdate = this.lastUpdates.get(realmId);
        if (lastUpdate) {
            if (lastUpdate.cache !== "") {
                return lastUpdate.cache;
            }

            // Fetch auctions and save to cache
            const auctions = await getRepository(Auction)
                .createQueryBuilder("auction")
                .select("auction.id", "id")
                .addSelect("auction.lowestPrice", "lowestPrice")
                .addSelect("auction.firstQuartile", "firstQuartile")
                .addSelect("auction.secondQuartile", "secondQuartile")
                .addSelect("auction.quantity", "quantity")
                .addSelect("auction.lastUpdate", "lastUpdate")
                .where("auction.realmId = :realmId", { realmId: realmId })
                .getRawMany();

            lastUpdate.cache = JSON.stringify({
                lastModified: lastUpdate.lastModified,
                auctions: auctions
            });
            return lastUpdate.cache;
        }
        throw new Error("Auctions#json " + realmId + " not found");
    }

    lastUpdate() {
        return Array.from(this.lastUpdates.entries()).map(p => {
            return {
                id: p["0"],
                lastAttempt: p["1"].lastAttempt,
                lastModified: p["1"].lastModified
            };
        });
    }
}
