import rp from "request-promise-native";
import { WOW_API_KEY } from "./secrets";

export enum Region {
    EU = "eu",
    US = "us"
}

type AuctionFile = { url: string, lastModified: Date };

export function getAuctionDataStatus(region: Region, realm: string) {
    return new Promise<AuctionFile[]>((resolve, reject) => {
        // {
        //     "files": [{
        //         "url": "http://auction-api-eu.worldofwarcraft.com/auction-data/e4a529d50fe9f24cff1ad0bf1c56c897/auctions.json",
        //         "lastModified": 1535890107000
        //     }]
        // }
        const url = "https://" + region + ".api.battle.net/wow/auction/data/" + realm + "?apikey=" + WOW_API_KEY;
        return rp(url).then((body: string) => {
            const data = JSON.parse(body);
            if (!data.files || data.files.length === 0) {
                return reject("Missing files");
            }
            const files: AuctionFile[] = [];
            for (const i of data.files) {
                if (!i.url || !i.lastModified) {
                    return reject("Bad file");
                }
                files.push({ url: i.url, lastModified: new Date(i.lastModified) });
            }
            return resolve(files);
        }, () => {
            return reject("Request failed");
        });
    });
}

type Item = { name: string, buyPrice?: number, stackSize: number };

export function getItem(itemId: number) {
    return new Promise<Item>((resolve, reject) => {
        const url = "https://eu.api.battle.net/wow/item/" + itemId + "?apikey=" + WOW_API_KEY;
        return rp(url).then((body: string) => {
            const data = JSON.parse(body);
            if (data.id !== itemId || !data.name || (!data.buyPrice && data.buyPrice !== 0) || !data.stackable) {
                return reject("Bad item");
            }
            const name = data.name;
            const stackSize = parseInt(data.stackable);
            if (data.buyPrice === 0) {
                return resolve({ name: name, stackSize: stackSize });
            }
            return resolve({ name: name, buyPrice: data.buyPrice, stackSize: stackSize });
        }, () => {
            return reject("Request failed");
        });
    });
}
