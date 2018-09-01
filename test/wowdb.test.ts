import { parseRecipesPage, getRecipes } from "../src/wowdb";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

describe("parseRecipesPage", () => {
    it("should parse the first page", async () => {
        const dom = new JSDOM(fs.readFileSync(path.join(__dirname, "wowdb_recipies_page1.html")).toString());
        const result = await parseRecipesPage(dom.window.document);
        expect(result.spellIds).toHaveLength(200);
        expect(result.spellIds[0]).toEqual(252378);
        expect(result.spellIds[199]).toEqual(269529);
        expect(result.next).toEqual(true);
    });

    it("should parse the last page", async () => {
        const dom = new JSDOM(fs.readFileSync(path.join(__dirname, "wowdb_recipies_page3.html")).toString());
        const result = await parseRecipesPage(dom.window.document);
        expect(result.spellIds).toHaveLength(194);
        expect(result.spellIds[0]).toEqual(256510);
        expect(result.spellIds[193]).toEqual(272230);
        expect(result.next).toEqual(false);
    });
});

describe("getRecipes", () => {
    it("should hopefully work", async () => {
        const spellIds = await getRecipes();
        expect(spellIds).not.toHaveLength(0);
    }, 20000);
});