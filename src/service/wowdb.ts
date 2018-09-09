import rp from "request-promise-native";
import * as t from "io-ts";
import { JSDOM } from "jsdom";
import { decodeOrThrow } from "../utils";
import { IRecipe } from "./recipes";

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
        const body = await rp.get(url, { timeout: 5000 });
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

const Reagent = t.type({
    Item: t.number,
    ItemQty: t.number
});

const Effect = t.type({
    Item: t.number,
    BasePoints: t.number
});

const Spell = t.type({
    ID: t.number,
    Icon: t.string,
    Rank: t.string,
    Reagents: t.refinement(t.array(Reagent), reagents => reagents.length !== 0),
    Name: t.refinement(t.string, name => !name.startsWith("REUSE ME")),
    Effects: t.refinement(t.array(Effect), effects => effects.length === 1)
});

export async function getRecipe(spellId: number): Promise<IRecipe> {
    const body = await rp.get("https://www.wowdb.com/api/spell/" + spellId, { timeout: 5000 });
    // Remove the extra parentheses in the body
    const spell = decodeOrThrow(Spell, JSON.parse(body.slice(1, -1)));
    const rankMatch = spell.Rank.match(/.* (\d+)/);
    const iconMatch = spell.Icon.match(/([^\.]+)\./);
    if (spell.ID !== spellId) {
        throw new Error("Wrong ID " + spellId);
    }
    if (!iconMatch) {
        throw new Error("No icon match " + spellId);
    }
    const rank = rankMatch ? parseInt(rankMatch[1]) : 0;
    const trade = iconMatch[1];
    const reagents = spell.Reagents.map((reagent) => {
        return { id: reagent.Item, quantity: reagent.ItemQty };
    });
    const effect = spell.Effects[0];
    const quantity = Math.max(1, effect.BasePoints);

    return {
        name: spell.Name,
        rank: rank,
        trade: trade,
        reagents: reagents,
        crafts: {
            id: effect.Item,
            quantity: quantity
        }
    };
}
