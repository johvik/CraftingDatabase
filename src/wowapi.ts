import rp from "request-promise-native";
import * as t from "io-ts";
import { DateFromNumber } from "io-ts-types/lib/Date/DateFromNumber";
import { WOW_API_KEY } from "./secrets";
import { decodeOrThrow } from "./utils";

export enum Region {
    EU = "eu",
    US = "us"
}

const AuctionFile = t.type({
    url: t.string,
    lastModified: DateFromNumber
});

type IAuctionFile = t.TypeOf<typeof AuctionFile>;

const AuctionFiles = t.type({
    files: t.refinement(t.array(AuctionFile), files => files.length > 0)
});

export async function getAuctionDataStatus(region: Region, realm: string): Promise<IAuctionFile[]> {
    // {
    //     "files": [{
    //         "url": "http://auction-api-eu.worldofwarcraft.com/auction-data/e4a529d50fe9f24cff1ad0bf1c56c897/auctions.json",
    //         "lastModified": 1535890107000
    //     }]
    // }
    const url = "https://" + region + ".api.battle.net/wow/auction/data/" + realm.toLowerCase() + "?apikey=" + WOW_API_KEY;
    const body = await rp.get(url, { timeout: 5000 });

    return decodeOrThrow(AuctionFiles, JSON.parse(body)).files;
}

const AuctionItem = t.type({
    item: t.number,
    buyout: t.number,
    quantity: t.number
});

type IAuctionItem = t.TypeOf<typeof AuctionItem>;

const AuctionRealm = t.type({
    name: t.string
});

const AuctionData = t.type({
    realms: t.array(AuctionRealm),
    auctions: t.array(AuctionItem)
});

export async function getAuctionData(expectedRealm: string, url: string): Promise<IAuctionItem[]> {
    const body = await rp.get(url, { timeout: 5000 });
    const data = decodeOrThrow(AuctionData, JSON.parse(body));
    if (!data.realms.some(realm => {
        return realm.name.toLowerCase() === expectedRealm.toLowerCase();
    })) {
        throw new Error("Realm not found " + expectedRealm);
    }
    return data.auctions;
}

const Item = t.type({
    name: t.string,
    buyPrice: t.number,
    stackable: t.number
});

type IItem = t.TypeOf<typeof Item>;

export async function getItem(itemId: number): Promise<IItem> {
    const url = "https://eu.api.battle.net/wow/item/" + itemId + "?apikey=" + WOW_API_KEY;
    const body = await rp.get(url, { timeout: 5000 });
    return decodeOrThrow(Item, JSON.parse(body));
}
