import rp from "request-promise-native";
import { JSDOM } from "jsdom";

type RecipiesParseResult = { spellIds: number[], next: boolean };

export function parseRecipesPage(document: Document): RecipiesParseResult {
    const listingsPage = document.querySelector("div.listings-page");
    if (!listingsPage) {
        throw new Error("Main div not found");
    }
    const spells = listingsPage.querySelectorAll("div.listing-body > table > tbody > tr > td.col-name a.t");
    if (spells.length === 0) {
        throw new Error("No spells found");
    }
    const spellIds: number[] = [];
    for (const i of spells) {
        const href = i.getAttribute("href");
        if (!href) {
            throw new Error("Missing href");
        }
        // sample: https://www.wowdb.com/spells/252378-endless-tincture-of-fractional-power
        const match = href.match(/\/spells\/(\d+)/);
        if (!match) {
            throw new Error("No spell id found in href");
        }
        const id = parseInt(match[1]);
        spellIds.push(id);
    }
    const next = listingsPage.querySelector("li.b-pagination-item.b-pagination-item-next") !== null;
    return { spellIds, next };
}

export async function getRecipesIds(): Promise<number[]> {
    const spellIds: number[] = [];
    for (let page = 1, next = true; next; page++) {
        const url = "https://www.wowdb.com/spells/professions?filter-expansion=8&filter-req-reagent=1&page=" + page;
        const body = await rp.get(url);
        const dom = new JSDOM(body);
        const result = parseRecipesPage(dom.window.document);
        spellIds.push(...result.spellIds);
        next = result.next;
        if (page > 20) {
            throw new Error("Unexpected amount of pages");
        }
    }
    return spellIds;
}

type Item = { id: number, quantity: number };
type Recipe = { id: number, name: string, trade: string, reagents: Item[], crafts: Item };

export async function getRecipe(spellId: number): Promise<Recipe> {
    const body = await rp.get("https://www.wowdb.com/api/spell/" + spellId);
    // Remove the extra parentheses in the body
    const data = JSON.parse(body.slice(1, -1));
    if (!data.ID || data.ID !== spellId || !data.Icon || !data.Reagents || !data.Name || !data.Effects) {
        throw new Error("Bad spell");
    }
    const match = (data.Icon + "").match(/([^\.]+)\./);
    if (!match) {
        throw new Error("No icon match");
    }
    const trade = match[1];
    const reagents: Item[] = [];
    for (const i of data.Reagents) {
        if (!i.Item || !i.ItemQty) {
            throw new Error("Bad Reagents");
        }
        reagents.push({ id: i.Item, quantity: i.ItemQty });
    }
    if (reagents.length === 0) {
        throw new Error("Expected at least one reagent");
    }
    if (data.Name.startsWith("REUSE ME")) {
        throw new Error("Skipping REUSE ME");
    }
    if (data.Effects.length !== 1) {
        throw new Error("Expected one effect");
    }
    const effect = data.Effects[0];
    if (!effect.Item || (!effect.BasePoints && effect.BasePoints !== 0)) {
        throw new Error("Bad effect");
    }
    const quantity = parseInt(effect.BasePoints);
    const crafts = { id: parseInt(effect.Item), quantity: (quantity !== 0 ? quantity : 1) };
    return { id: data.ID, name: data.Name, trade: trade, reagents: reagents, crafts: crafts };
}
