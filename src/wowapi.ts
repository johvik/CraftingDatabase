import rp from "request-promise-native";
import { WOW_API_KEY } from "./secrets";

export enum Region {
    EU = "eu",
    US = "us"
}

type AuctionFile = { url: string, lastModified: Date };

export class WowApi {
    readonly region: Region;
    readonly realm: string;

    constructor(region: Region, realm: string) {
        this.region = region;
        this.realm = realm.toLowerCase();
    }

    getAuctionDataStatus() {
        return new Promise<AuctionFile[]>((resolve, reject) => {
            // {
            //     "files": [{
            //         "url": "http://auction-api-eu.worldofwarcraft.com/auction-data/e4a529d50fe9f24cff1ad0bf1c56c897/auctions.json",
            //         "lastModified": 1535890107000
            //     }]
            // }
            const url = "https://" + this.region + ".api.battle.net/wow/auction/data/" + this.realm + "?locale=en_GB&apikey=" + WOW_API_KEY;
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
}
