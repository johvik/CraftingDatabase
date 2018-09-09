import { Region, getAuctionDataStatus, getItem } from "../../src/service/wowapi";

describe("getAuctionDataStatus", () => {
    it("should get Draenor EU", async () => {
        const files = await getAuctionDataStatus(Region.EU, "draenor");
        expect(files).not.toHaveLength(0);
    });
});

describe("getItem", () => {
    it("should get Powdered Sugar", async () => {
        const item = await getItem(160712);
        expect(item).toEqual({
            name: "Powdered Sugar",
            icon: "inv_cooking_80_powderedsugar",
            price: 25000,
            stackSize: 200
        });
    });

    it("should get Silvercoat Stag Meat", async () => {
        const item = await getItem(35794);
        expect(item).toEqual({
            name: "Silvercoat Stag Meat",
            icon: "inv_misc_food_70",
            price: 8000,
            stackSize: 20
        });
    });

    it("should get Big Gamy Ribs", async () => {
        const item = await getItem(124119);
        expect(item).toEqual({
            name: "Big Gamy Ribs",
            icon: "inv_misc_food_legion_biggameyribs",
            price: 0,
            stackSize: 200
        });
    });

    it("should get Aromatic Fish Oil", async () => {
        // TODO This seems to be sold in limited amounts, can it be solved?
        const item = await getItem(160711);
        expect(item).toEqual({
            name: "Aromatic Fish Oil",
            icon: "trade_alchemy_dpotion_e2",
            price: 25000,
            stackSize: 200
        });
    });

    it("should get Gloom Dust", async () => {
        const item = await getItem(152875);
        expect(item).toEqual({
            name: "Gloom Dust",
            icon: "inv_enchanting_80_shadowdust",
            price: 0,
            stackSize: 200
        });
    });

    it("should get Flask of Endless Fathoms", async () => {
        const item = await getItem(152639);
        expect(item).toEqual({
            name: "Flask of Endless Fathoms",
            icon: "inv_alchemy_80_flask01purple",
            price: 10000,
            stackSize: 20
        });
    });
});
