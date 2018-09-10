import * as t from "io-ts";
import { decodeOrThrow, delay } from "../utils";
import { DateFromISOString } from "io-ts-types/lib/Date/DateFromISOString";
import { readFileSync, writeFileSync } from "fs";
import { getItem, Quotas } from "./wowapi";
import { Recipes } from "./recipes";
import { Auctions } from "./auctions";

const Item = t.type({
    name: t.string,
    icon: t.string,
    price: t.number,
    stackSize: t.number
});
export type IItem = t.TypeOf<typeof Item>;

const MaybeItem = t.partial({
    item: Item
});

const ItemUpdated = t.type({
    updated: DateFromISOString
});

const ItemInfo = t.intersection([ItemUpdated, MaybeItem]);
const ItemInfos = t.dictionary(t.refinement(t.string, key => /^\d+$/.test(key)), ItemInfo);
type IItemInfos = t.TypeOf<typeof ItemInfos>;

export class Items {
    private readonly file = "items.json";
    private jsonCache = "{}";
    private items: IItemInfos = this.loadFromFile();
    private lastUpdatefailures = new Set<number>();

    private loadFromFile(): IItemInfos {
        try {
            this.jsonCache = readFileSync(this.file).toString();
            return decodeOrThrow(ItemInfos, JSON.parse(this.jsonCache));
        } catch (error) {
            console.debug("Items#loadFromFile", error, new Date());
        }
        return {};
    }

    async updateAll(recipes: Recipes) {
        return this.update(recipes, true);
    }

    async updateUnknown(recipes: Recipes) {
        return this.update(recipes, false);
    }

    private async update(recipes: Recipes, updateAll: boolean) {
        const ids = new Set<number>([...recipes.items(), ...await Auctions.items()]);
        const never = new Date(0);
        for (const id of ids) {
            if (!this.items[id]) {
                this.items[id] = { updated: never };
            }
        }
        let list = Object.keys(this.items).map(value => parseInt(value));
        if (!updateAll) {
            // Filter unknown
            list = list.filter(id => !this.items[id].item);
        }
        await this.updateItems(list);
    }

    private async updateItems(ids: number[]) {
        // TODO Limit to the quota per hour?
        const updateFailures = new Set<number>();
        const now = new Date();
        let start = now.getTime();
        let i = 0;
        for (const id of ids) {
            try {
                const item = await getItem(id);
                const value = this.items[id];
                value.item = item;
                value.updated = now;
            } catch (error) {
                if (!this.lastUpdatefailures.has(id)) {
                    console.debug("Items#updateItems " + id, error, new Date());
                }
                updateFailures.add(id);
            }

            // Limit requests per second to the quota
            i += 1;
            if (i >= Quotas.requestsPerSecond) {
                const diff = new Date().getTime() - start;
                await delay(1000 - diff);
                start = new Date().getTime();
                i = 0;
            }
        }
        this.lastUpdatefailures = updateFailures;
        this.jsonCache = JSON.stringify(this.items);
        writeFileSync(this.file, this.jsonCache);
    }

    json() {
        return this.jsonCache;
    }
}
