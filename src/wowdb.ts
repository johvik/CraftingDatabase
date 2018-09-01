import { getDocument } from "./utils";

type RecipiesParseResult = { spellIds: number[], next: boolean };

export function parseRecipesPage(document: Document) {
    return new Promise<RecipiesParseResult>((resolve, reject) => {
        const listingsPage = document.querySelector("div.listings-page");
        if (listingsPage) {
            const spells = listingsPage.querySelectorAll("div.listing-body > table > tbody > tr > td.col-name a.t");
            if (spells.length === 0) {
                return reject("No spells found");
            }
            const spellIds: number[] = [];
            for (const i of spells) {
                const href = i.getAttribute("href");
                if (href) {
                    // sample: https://www.wowdb.com/spells/252378-endless-tincture-of-fractional-power
                    const match = href.match(/\/spells\/(\d+)/);
                    if (match) {
                        const id = parseInt(match[1]);
                        spellIds.push(id);
                    } else {
                        return reject("No spell id found in href");
                    }
                } else {
                    return reject("Missing href");
                }
            }
            const next = listingsPage.querySelector("li.b-pagination-item.b-pagination-item-next") !== null;
            return resolve({ spellIds, next });
        } else {
            return reject("Main div not");
        }
    });
}

export function getRecipes() {
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