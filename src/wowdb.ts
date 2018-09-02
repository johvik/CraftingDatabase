import rp from "request-promise-native";
import { getDocument } from "./utils";

type RecipiesParseResult = { spellIds: number[], next: boolean };

export function parseRecipesPage(document: Document) {
    return new Promise<RecipiesParseResult>((resolve, reject) => {
        const listingsPage = document.querySelector("div.listings-page");
        if (!listingsPage) {
            return reject("Main div not found");
        }
        const spells = listingsPage.querySelectorAll("div.listing-body > table > tbody > tr > td.col-name a.t");
        if (spells.length === 0) {
            return reject("No spells found");
        }
        const spellIds: number[] = [];
        for (const i of spells) {
            const href = i.getAttribute("href");
            if (!href) {
                return reject("Missing href");
            }
            // sample: https://www.wowdb.com/spells/252378-endless-tincture-of-fractional-power
            const match = href.match(/\/spells\/(\d+)/);
            if (!match) {
                return reject("No spell id found in href");
            }
            const id = parseInt(match[1]);
            spellIds.push(id);
        }
        const next = listingsPage.querySelector("li.b-pagination-item.b-pagination-item-next") !== null;
        return resolve({ spellIds, next });
    });
}

export function getRecipesIds() {
    return new Promise<number[]>(async (resolve, reject) => {
        const spellIds: number[] = [];
        for (let page = 1, next = true; next; page++) {
            try {
                const document = await getDocument("https://www.wowdb.com/spells/professions?filter-expansion=8&filter-req-reagent=1&page=" + page);
                const result = await parseRecipesPage(document);
                spellIds.push(...result.spellIds);
                next = result.next;
            } catch (error) {
                return reject(error);
            }
            if (page > 20) {
                return reject("Unexpected amount of pages");
            }
        }
        return resolve(spellIds);
    });
}

type Item = { id: number, quantity: number };
type Recipe = { id: number, name: string, trade: string, reagents: Item[], crafts: Item };

export function getRecipe(spellId: number) {
    return new Promise<Recipe>((resolve, reject) => {
        return rp.get("https://www.wowdb.com/api/spell/" + spellId).then((body: string) => {
            // Remove the extra parentheses in the body
            const data = JSON.parse(body.slice(1, -1));
            if (data.ID && data.ID === spellId && data.Icon && data.Reagents && data.Name && data.Effects) {
                const match = (data.Icon + "").match(/([^\.]+)\./);
                if (!match) {
                    return reject("No icon match");
                }
                const trade = match[1];
                const reagents: Item[] = [];
                for (const i of data.Reagents) {
                    if (!i.Item || !i.ItemQty) {
                        return reject("Bad Reagents");
                    }
                    reagents.push({ id: i.Item, quantity: i.ItemQty });
                }
                if (reagents.length === 0) {
                    return reject("Expected at least one reagent");
                }
                if (data.Name.startsWith("REUSE ME")) {
                    return reject("Skipping REUSE ME");
                }
                if (data.Effects.length !== 1) {
                    return reject("Expected one effect");
                }
                const effect = data.Effects[0];
                if (!effect.Item || (!effect.BasePoints && effect.BasePoints !== 0)) {
                    return reject("Bad effect");
                }
                const quantity = parseInt(effect.BasePoints);
                const crafts = { id: parseInt(effect.Item), quantity: (quantity !== 0 ? quantity : 1) };
                return resolve({ id: data.ID, name: data.Name, trade: trade, reagents: reagents, crafts: crafts });
            }
            return reject("Bad spell");
        }, () => {
            return reject("Request failed");
        });
    });
}

export function getVendorPrice(itemId: number) {
    return new Promise<number>((resolve, reject) => {
        return rp.get("https://www.wowdb.com/api/item/" + itemId).then((body: string) => {
            // Remove the extra parentheses in the body
            const data = JSON.parse(body.slice(1, -1));
            if (data.ID && data.ID === itemId && data.BuyPrice && (data.Source || data.Source === 0) && data.BindType === 0) {
                const price = parseInt(data.BuyPrice);
                // Assume Source=0 is vendor for now, seems like some of the items are
                const vendor = (data.Source & 0x4000) !== 0 || data.Source === 0;
                if (price && vendor) {
                    return resolve(price);
                }
                return reject("Not a vendor item");
            }
            return reject("Bad item");
        }, () => {
            return reject("Request failed");
        });
    });
}
