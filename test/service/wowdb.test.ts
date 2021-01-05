import getRecipe from "../../src/service/wowdb";

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
        { id: 160709, quantity: 4 },
      ],
      crafts: { id: 154888, quantity: 10 },
    });
  });

  it("should get Weapon Enchant - Siphoning", async () => {
    const recipe = await getRecipe(255112);
    expect(recipe).toEqual({
      name: "Siphoning",
      rank: 3,
      trade: "trade_engraving",
      reagents: [
        { id: 152876, quantity: 3 },
        { id: 152875, quantity: 15 },
        { id: 152877, quantity: 1 },
      ],
      crafts: { id: 153478, quantity: 1 },
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
        { id: 3371, quantity: 1 },
      ],
      crafts: { id: 152640, quantity: 1 },
    });
  });

  it("should skip REUSE ME", async () => {
    expect.assertions(1);
    await expect(getRecipe(269461)).rejects.toThrowError(
      'Invalid value "REUSE ME'
    );
  });

  it("should get Transmute: Herbs to Ore", async () => {
    const recipe = await getRecipe(251305);
    expect(recipe).toEqual({
      name: "Transmute: Herbs to Ore",
      rank: 0,
      trade: "trade_alchemy",
      reagents: [
        { id: 152509, quantity: 5 },
        { id: 152505, quantity: 5 },
      ],
      crafts: { id: 160322, quantity: 1 },
    });
  });

  it("should get Eternal Grace", async () => {
    const recipe = await getRecipe(309621);
    expect(recipe).toEqual({
      name: "Eternal Grace",
      rank: 0,
      trade: "trade_engraving",
      reagents: [
        { id: 172232, quantity: 2 },
        { id: 172231, quantity: 3 },
      ],
      crafts: { id: 172367, quantity: 1 },
    });
  });
});
