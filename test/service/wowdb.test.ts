import { parseRecipesPage, getRecipesIds, getRecipe } from "../../src/service/wowdb";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

describe("parseRecipesPage", () => {
    it("should parse the first page", () => {
        const dom = new JSDOM(fs.readFileSync(path.join(__dirname, "..", "data", "wowdb_recipies_page1.html.data")).toString());
        const result = parseRecipesPage(dom.window.document);
        expect(result.spellIds).toHaveLength(200);
        expect(result.spellIds[0]).toEqual(252378);
        expect(result.spellIds[199]).toEqual(269529);
        expect(result.next).toEqual(true);
    });

    it("should parse the last page", () => {
        const dom = new JSDOM(fs.readFileSync(path.join(__dirname, "..", "data", "wowdb_recipies_page3.html.data")).toString());
        const result = parseRecipesPage(dom.window.document);
        expect(result.spellIds).toHaveLength(194);
        expect(result.spellIds[0]).toEqual(256510);
        expect(result.spellIds[193]).toEqual(272230);
        expect(result.next).toEqual(false);
    });

    it("should not find the main div", () => {
        const dom = new JSDOM("");
        expect(() => {
            parseRecipesPage(dom.window.document);
        }).toThrowError("Main div not found");
    });

    it("should not find spells", () => {
        const dom = new JSDOM("<div class=\"listings-page\"></div>");
        expect(() => {
            parseRecipesPage(dom.window.document);
        }).toThrowError("No spells found");
    });

    it("should not find href", () => {
        const dom = new JSDOM(
            "<div class=\"listings-page\"> \
             <div class=\"listing-body\"> \
             <table> \
             <tbody> \
             <tr> \
             <td class=\"col-name\"> \
             <a class=\"t\">link</a> \
             </td></tr></tbody></table></div></div>");
        expect(() => {
            parseRecipesPage(dom.window.document);
        }).toThrowError("Missing href");
    });

    it("should not find spell id", () => {
        const dom = new JSDOM(
            "<div class=\"listings-page\"> \
            <div class=\"listing-body\"> \
            <table> \
            <tbody> \
            <tr> \
            <td class=\"col-name\"> \
            <a class=\"t\" href=\"foo\">link</a> \
            </td></tr></tbody></table></div></div>");
        expect(() => {
            parseRecipesPage(dom.window.document);
        }).toThrowError("No spell id found in href");
    });
});

describe("getRecipesIds", () => {
    it("should hopefully work", async () => {
        const spellIds = await getRecipesIds();
        expect(spellIds).not.toHaveLength(0);
    }, 20000);
});

describe("getRecipe", () => {
    it("should get Sailor's Pie", async () => {
        const recipe = await getRecipe(259441);
        expect(recipe).toEqual({
            name: "Sailor's Pie",
            rank: 3,
            trade: "inv_misc_food_15",
            reagents: [
                { id: 152631, quantity: 10 },
                { id: 160399, quantity: 5 },
                { id: 160400, quantity: 4 },
                { id: 160709, quantity: 4 }],
            crafts: { id: 154888, quantity: 10 }
        });
    });

    it("should get Weapon Enchant - Siphoning", async () => {
        const recipe = await getRecipe(255112);
        expect(recipe).toEqual({
            name: "Weapon Enchant - Siphoning",
            rank: 3,
            trade: "trade_engraving",
            reagents: [
                { id: 152876, quantity: 3 },
                { id: 152875, quantity: 15 },
                { id: 152877, quantity: 1 }],
            crafts: { id: 153478, quantity: 1 }
        });
    });

    it("should get Flask of the Vast Horizon", async () => {
        const recipe = await getRecipe(252354);
        expect(recipe).toEqual({
            name: "Flask of the Vast Horizon",
            rank: 1,
            trade: "trade_alchemy",
            reagents: [
                { id: 152510, quantity: 10 },
                { id: 152508, quantity: 15 },
                { id: 152506, quantity: 20 },
                { id: 3371, quantity: 1 }],
            crafts: { id: 152640, quantity: 1 }
        });
    });

    it("should skip REUSE ME", async () => {
        expect.assertions(1);
        await expect(getRecipe(269461)).rejects.toThrowError("Invalid value \"REUSE ME");
    });

    it("should skip REUSE ME (DNT)", async () => {
        expect.assertions(1);
        await expect(getRecipe(255106)).rejects.toThrowError("Invalid value \"REUSE ME");
    });

    it("should get Transmute: Herbs to Ore", async () => {
        const recipe = await getRecipe(251305);
        expect(recipe).toEqual({
            name: "Transmute: Herbs to Ore",
            rank: 0,
            trade: "trade_alchemy",
            reagents: [
                { id: 152509, quantity: 5 },
                { id: 152505, quantity: 5 }],
            crafts: { id: 160322, quantity: 1 }
        });
    });
});