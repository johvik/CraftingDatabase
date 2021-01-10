import Region from "../../src/region";
import {
  getAccessToken,
  getConnectedRealms,
  getItem,
} from "../../src/service/wowapi";

let accessToken = "";

beforeAll(async () => {
  accessToken = (await getAccessToken(Region.EU)).access_token;
});

describe("getAccessToken", () => {
  it("should get EU", () => {
    expect(accessToken.length).toEqual(34);
  });
});

describe("getConnectedRealms", () => {
  it("should get EU 1096", async () => {
    const realms = await getConnectedRealms(Region.EU, 1096, accessToken);
    expect(realms).toEqual([
      "Scarshield Legion",
      "Earthen Ring",
      "Defias Brotherhood",
      "The Venture Co",
      "Ravenholdt",
      "Darkmoon Faire",
      "Sporeggar",
    ]);
  });
});

describe("getItem", () => {
  it("should get Powdered Sugar", async () => {
    const item = await getItem(160712, accessToken);
    expect(item).toEqual({
      name: "Powdered Sugar",
      icon: expect.stringContaining("inv_cooking_80_powderedsugar"),
      price: 25000,
    });
  });

  it("should get Silvercoat Stag Meat", async () => {
    const item = await getItem(35794, accessToken);
    expect(item).toEqual({
      name: "Silvercoat Stag Meat",
      icon: expect.stringContaining("inv_misc_food_70"),
      price: 8000,
    });
  });

  it("should get Big Gamy Ribs", async () => {
    const item = await getItem(124119, accessToken);
    expect(item).toEqual({
      name: "Big Gamy Ribs",
      icon: expect.stringContaining("inv_misc_food_legion_biggameyribs"),
      price: 1200,
    });
  });

  it("should get Aromatic Fish Oil", async () => {
    // TODO This seems to be sold in limited amounts, can it be solved?
    const item = await getItem(160711, accessToken);
    expect(item).toEqual({
      name: "Aromatic Fish Oil",
      icon: expect.stringContaining("trade_alchemy_dpotion_e2"),
      price: 25000,
    });
  });

  it("should get Gloom Dust", async () => {
    const item = await getItem(152875, accessToken);
    expect(item).toEqual({
      name: "Gloom Dust",
      icon: expect.stringContaining("inv_enchanting_80_shadowdust"),
      price: 28000,
    });
  });

  it("should get Flask of Endless Fathoms", async () => {
    const item = await getItem(152639, accessToken);
    expect(item).toEqual({
      name: "Flask of Endless Fathoms",
      icon: expect.stringContaining("inv_alchemy_80_flask01purple"),
      price: 50000,
    });
  });
});
