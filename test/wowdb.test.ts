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

    it("should not find the main div", async () => {
        const dom = new JSDOM("");
        expect.assertions(1);
        await expect(parseRecipesPage(dom.window.document)).rejects.toEqual("Main div not found");
    });

    it("should not find spells", async () => {
        const dom = new JSDOM("<div class=\"listings-page\"></div>");
        expect.assertions(1);
        await expect(parseRecipesPage(dom.window.document)).rejects.toEqual("No spells found");
    });

    it("should not find href", async () => {
        const dom = new JSDOM(
            "<div class=\"listings-page\"> \
             <div class=\"listing-body\"> \
             <table> \
             <tbody> \
             <tr> \
             <td class=\"col-name\"> \
             <a class=\"t\">link</a> \
             </td></tr></tbody></table></div></div>");
        expect.assertions(1);
        await expect(parseRecipesPage(dom.window.document)).rejects.toEqual("Missing href");
    });

    it("should not find spell id", async () => {
        const dom = new JSDOM(
            "<div class=\"listings-page\"> \
            <div class=\"listing-body\"> \
            <table> \
            <tbody> \
            <tr> \
            <td class=\"col-name\"> \
            <a class=\"t\" href=\"foo\">link</a> \
            </td></tr></tbody></table></div></div>");
        expect.assertions(1);
        await expect(parseRecipesPage(dom.window.document)).rejects.toEqual("No spell id found in href");
    });
});

describe("getRecipes", () => {
    it("should hopefully work", async () => {
        const spellIds = await getRecipes();
        expect(spellIds).not.toHaveLength(0);
    }, 20000);
});
