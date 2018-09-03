import { Region, getAuctionDataStatus, getItem } from "../src/wowapi";

describe("getAuctionDataStatus", () => {
    it("should get Draenor EU", async () => {
        const files = await getAuctionDataStatus(Region.EU, "draenor");
        expect(files).not.toHaveLength(0);
    });
});

describe("getItem", () => {
    it("should get Powdered Sugar", async () => {
        const item = await getItem(160712);
        expect(item).toEqual({ name: "Powdered Sugar", buyPrice: 25000, stackSize: 200 });
    });

    it("should get Silvercoat Stag Meat", async () => {
        const item = await getItem(35794);
        expect(item).toEqual({ name: "Silvercoat Stag Meat", buyPrice: 8000, stackSize: 20 });
    });

    it("should get Big Gamy Ribs", async () => {
        const item = await getItem(124119);
        expect(item).toEqual({ name: "Big Gamy Ribs", buyPrice: 0, stackSize: 200 });
    });

    it("should get Aromatic Fish Oil", async () => {
        // TODO This seems to be sold in limited amounts, can it be solved?
        const item = await getItem(160711);
        expect(item).toEqual({ name: "Aromatic Fish Oil", buyPrice: 25000, stackSize: 200 });
    });

    it("should get Gloom Dust", async () => {
        const item = await getItem(152875);
        expect(item).toEqual({ name: "Gloom Dust", buyPrice: 0, stackSize: 200 });
    });
});
