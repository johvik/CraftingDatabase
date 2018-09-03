import rp from "request-promise-native";
import { WOW_API_KEY } from "./secrets";

export enum Region {
    EU = "eu",
    US = "us"
}

type AuctionFile = { url: string, lastModified: Date };

export async function getAuctionDataStatus(region: Region, realm: string): Promise<AuctionFile[]> {
    // {
    //     "files": [{
    //         "url": "http://auction-api-eu.worldofwarcraft.com/auction-data/e4a529d50fe9f24cff1ad0bf1c56c897/auctions.json",
    //         "lastModified": 1535890107000
    //     }]
    // }
    const url = "https://" + region + ".api.battle.net/wow/auction/data/" + realm + "?apikey=" + WOW_API_KEY;
    const body = await rp.get(url);

    const data = JSON.parse(body);
    if (!data.files || data.files.length === 0) {
        throw new Error("Missing files");
    }
    const files: AuctionFile[] = [];
    for (const i of data.files) {
        if (!i.url || !i.lastModified) {
            throw new Error("Bad file");
        }
        files.push({ url: i.url, lastModified: new Date(i.lastModified) });
    }
    return files;
}

type Item = { name: string, buyPrice: number, stackSize: number };

export async function getItem(itemId: number): Promise<Item> {
    const url = "https://eu.api.battle.net/wow/item/" + itemId + "?apikey=" + WOW_API_KEY;
    const body = await rp.get(url);
    const data = JSON.parse(body);
    if (data.id !== itemId || !data.name || (!data.buyPrice && data.buyPrice !== 0) || !data.stackable) {
        throw new Error("Bad item");
    }
    const name = data.name;
    const stackSize = parseInt(data.stackable);
    return { name: name, buyPrice: data.buyPrice, stackSize: stackSize };
}
