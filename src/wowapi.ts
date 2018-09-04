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

const AuctionFiles = t.type({
    files: t.refinement(t.array(AuctionFile), files => files.length > 0)
});

type IAuctionFile = t.TypeOf<typeof AuctionFile>;

export async function getAuctionDataStatus(region: Region, realm: string): Promise<IAuctionFile[]> {
    // {
    //     "files": [{
    //         "url": "http://auction-api-eu.worldofwarcraft.com/auction-data/e4a529d50fe9f24cff1ad0bf1c56c897/auctions.json",
    //         "lastModified": 1535890107000
    //     }]
    // }
    const url = "https://" + region + ".api.battle.net/wow/auction/data/" + realm + "?apikey=" + WOW_API_KEY;
    const body = await rp.get(url);

    return decodeOrThrow(AuctionFiles, JSON.parse(body)).files;
}

const Item = t.type({
    name: t.string,
    buyPrice: t.number,
    stackable: t.number
});

type IItem = t.TypeOf<typeof Item>;

export async function getItem(itemId: number): Promise<IItem> {
    const url = "https://eu.api.battle.net/wow/item/" + itemId + "?apikey=" + WOW_API_KEY;
    const body = await rp.get(url);
    return decodeOrThrow(Item, JSON.parse(body));
}
