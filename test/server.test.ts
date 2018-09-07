import "../src/server";
import { dummy } from "../src/server";

describe("Hello world", () => {
    it("should have one test", async () => {
        await dummy();
    });
});
