import { parsePage, getAll } from "../../src/service/wowhead";
import fs from "fs";
import path from "path";

describe("parsePage", () => {
    it("should parse cooking", () => {
        const content = fs.readFileSync(path.join(__dirname, "..", "data", "wowhead_cooking.html.data")).toString();
        const result = parsePage(content, "cooking");

        expect(Object.keys(result)).toEqual(["items", "recipes"]);
        expect(Object.keys(result.items)).toHaveLength(34);
        expect(Object.keys(result.recipes)).toHaveLength(37);

        expect(result.items[160709]).toEqual({
            name: "Fresh Potato",
            icon: "inv_cooking_80_brownpotato",
            price: 25000
        });
        expect(result.items[154888]).toEqual({
            name: "Sailor's Pie",
            icon: "inv_cooking_80_sailorspie"
        });

        expect(result.recipes[259411]).toEqual({
            crafts: {
                id: 154881,
                quantity: 5
            },
            name: "Kul Tiramisu",
            icon: "inv_cooking_80_kultiramisu",
            profession: "cooking",
            reagents: [
                {
                    id: 160399,
                    quantity: 10
                },
                {
                    id: 160400,
                    quantity: 5
                },
                {
                    id: 160711,
                    quantity: 2
                },
                {
                    id: 160705,
                    quantity: 5
                }]
        });
    });

    it("should parse enchanting", () => {
        const content = fs.readFileSync(path.join(__dirname, "..", "data", "wowhead_enchanting.html.data")).toString();
        const result = parsePage(content, "enchanting");

        expect(Object.keys(result)).toEqual(["items", "recipes"]);
        expect(Object.keys(result.items)).toHaveLength(10);
        expect(Object.keys(result.recipes)).toHaveLength(73);

        expect(result.items[152877]).toEqual({
            name: "Veiled Crystal",
            icon: "inv_enchanting_80_veiledcrystal"
        });

        expect(result.recipes[255070]).toEqual({
            name: "Kul Tiran Crafting",
            icon: "trade_engraving",
            profession: "enchanting",
            reagents: [{
                id: 152875,
                quantity: 5
            }]
        });
        expect(result.recipes[278418]).toEqual({
            crafts: {
                id: 162110,
                quantity: 1
            },
            name: "Disenchanting Rod",
            icon: "inv_rod_enchantedeternium",
            profession: "enchanting",
            reagents: [
                { id: 11291, quantity: 1 },
                { id: 152875, quantity: 40 },
                { id: 152877, quantity: 5 },
                { id: 152668, quantity: 30 },
                { id: 162460, quantity: 1 }
            ]
        });
    });
});

describe("getAll", () => {
    it("should hopefully work", async () => {
        const result = await getAll();

        expect(Object.keys(result)).toEqual(["items", "recipes"]);
        expect(Object.keys(result.items).length).toBeGreaterThan(300);
        expect(Object.keys(result.recipes).length).toBeGreaterThan(500);
    }, 100000);
});