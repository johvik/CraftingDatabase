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
        expect(item).toMatchObject({ name: "Powdered Sugar", buyPrice: 25000, stackable: 200 });
    });

    it("should get Silvercoat Stag Meat", async () => {
        const item = await getItem(35794);
        expect(item).toMatchObject({ name: "Silvercoat Stag Meat", buyPrice: 8000, stackable: 20 });
    });

    it("should get Big Gamy Ribs", async () => {
        const item = await getItem(124119);
        expect(item).toMatchObject({ name: "Big Gamy Ribs", buyPrice: 0, stackable: 200 });
    });

    it("should get Aromatic Fish Oil", async () => {
        // TODO This seems to be sold in limited amounts, can it be solved?
        const item = await getItem(160711);
        expect(item).toMatchObject({ name: "Aromatic Fish Oil", buyPrice: 25000, stackable: 200 });
    });

    it("should get Gloom Dust", async () => {
        const item = await getItem(152875);
        expect(item).toMatchObject({ name: "Gloom Dust", buyPrice: 0, stackable: 200 });
    });
});
