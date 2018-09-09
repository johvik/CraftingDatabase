import { Region, getAuctionDataStatus, getItem, IItem } from "../../src/service/wowapi";

describe("getAuctionDataStatus", () => {
    it("should get Draenor EU", async () => {
        const files = await getAuctionDataStatus(Region.EU, "draenor");
        expect(files).not.toHaveLength(0);
    });
});

describe("getItem", () => {
    it("should get Powdered Sugar", async () => {
        const item = await getItem(160712);
        const expected: IItem = { name: "Powdered Sugar", icon: "inv_cooking_80_powderedsugar", buyPrice: 25000, stackable: 200 };
        expect(item).toMatchObject(expected);
    });

    it("should get Silvercoat Stag Meat", async () => {
        const item = await getItem(35794);
        const expected: IItem = { name: "Silvercoat Stag Meat", icon: "inv_misc_food_70", buyPrice: 8000, stackable: 20 };
        expect(item).toMatchObject(expected);
    });

    it("should get Big Gamy Ribs", async () => {
        const item = await getItem(124119);
        const expected: IItem = { name: "Big Gamy Ribs", icon: "inv_misc_food_legion_biggameyribs", buyPrice: 0, stackable: 200 };
        expect(item).toMatchObject(expected);
    });

    it("should get Aromatic Fish Oil", async () => {
        // TODO This seems to be sold in limited amounts, can it be solved?
        const item = await getItem(160711);
        const expected: IItem = { name: "Aromatic Fish Oil", icon: "trade_alchemy_dpotion_e2", buyPrice: 25000, stackable: 200 };
        expect(item).toMatchObject(expected);
    });

    it("should get Gloom Dust", async () => {
        const item = await getItem(152875);
        const expected: IItem = { name: "Gloom Dust", icon: "inv_enchanting_80_shadowdust", buyPrice: 0, stackable: 200 };
        expect(item).toMatchObject(expected);
    });

    it("should get Flask of Endless Fathoms", async () => {
        const item = await getItem(152639);
        const expected: IItem = { name: "Flask of Endless Fathoms", icon: "inv_alchemy_80_flask01purple", buyPrice: 10000, stackable: 20 };
        expect(item).toMatchObject(expected);
    });
});
