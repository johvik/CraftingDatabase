import { Region, WowApi } from "../src/wowapi";

describe("getAuctionDataStatus", () => {
    it("should hopefully work", async () => {
        const files = await new WowApi(Region.EU, "draenor").getAuctionDataStatus();
        expect(files).not.toHaveLength(0);
    });
});
