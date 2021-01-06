import fs from "fs";
import path from "path";
import { parsePage, getAll } from "../../src/service/wowhead";

describe("parsePage", () => {
  it("should parse cooking", () => {
    const content = fs
      .readFileSync(
        path.join(__dirname, "..", "data", "wowhead_cooking.html.data")
      )
      .toString();
    const result = parsePage(content, "cooking");

    expect(Object.keys(result)).toEqual(["items", "recipes"]);
    expect(result.items.size).toEqual(59);
    expect(result.recipes.size).toEqual(31);

    expect(result.items.get(172059)).toEqual({
      name: "Rich Grazer Milk",
      icon: "inv_drink_milk_03",
      price: 42500,
    });
    expect(result.items.get(172048)).toEqual({
      name: "Meaty Apple Dumplings",
      icon: "inv_cooking_90_meatyappledumplings",
    });

    expect(result.recipes.get(308400)).toEqual({
      crafts: {
        id: 172041,
        quantity: 3,
      },
      name: "Spinefin Souffle and Fries",
      icon: "inv_cooking_90_phantasmalsoufflefries",
      profession: "cooking",
      reagents: [
        {
          id: 173036,
          quantity: 3,
        },
        {
          id: 173033,
          quantity: 3,
        },
        {
          id: 172058,
          quantity: 4,
        },
        {
          id: 172057,
          quantity: 2,
        },
      ],
    });
  });

  it("should parse enchanting", () => {
    const content = fs
      .readFileSync(
        path.join(__dirname, "..", "data", "wowhead_enchanting.html.data")
      )
      .toString();
    const result = parsePage(content, "enchanting");

    expect(Object.keys(result)).toEqual(["items", "recipes"]);
    expect(result.items.size).toEqual(23);
    expect(result.recipes.size).toEqual(45);

    expect(result.items.get(181990)).toEqual({
      name: "Twilight Dust",
      icon: "inv_enchanting_80_shadowdust",
    });

    expect(result.recipes.get(323609)).toEqual({
      name: "Soul Treads",
      icon: "trade_engraving",
      profession: "enchanting",
      reagents: [
        {
          id: 172230,
          quantity: 3,
        },
      ],
    });
    expect(result.recipes.get(309638)).toEqual({
      crafts: {
        id: 172439,
        quantity: 1,
      },
      name: "Enchanted Lightless Silk",
      icon: "inv_enchanting_craftedreagent_cloth",
      profession: "enchanting",
      reagents: [
        { id: 172230, quantity: 1 },
        { id: 173204, quantity: 2 },
      ],
    });
  });
});

describe("getAll", () => {
  it("should hopefully work", async () => {
    const result = await getAll();

    expect(Object.keys(result)).toEqual(["items", "recipes"]);
    expect(result.items.size).toBeGreaterThan(300);
    expect(result.recipes.size).toBeGreaterThan(500);
  }, 100000);
});
