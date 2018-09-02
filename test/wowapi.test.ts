import { Region, getAuctionDataStatus } from "../src/wowapi";

describe("getAuctionDataStatus", () => {
    it("should get Draenor EU", async () => {
        const files = await getAuctionDataStatus(Region.EU, "draenor");
        expect(files).not.toHaveLength(0);
    });
});
