import { getDocument } from "../src/utils";

describe("getDocument", () => {
    it("should get google.com", async () => {
        const document = await getDocument("https://www.google.com");
        expect(document.body.textContent).not.toHaveLength(0);
    });

    it("should not get a bad url", async () => {
        expect.assertions(1);
        await expect(getDocument("http://")).rejects.toThrowError("Invalid URI");
    });
});
