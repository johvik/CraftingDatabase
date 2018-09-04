import { decodeOrThrow } from "../src/utils";
import * as t from "io-ts";

describe("decodeOrThrow", () => {
    const Person = t.type({
        name: t.string,
        age: t.number
    });

    it("should decode", () => {
        const person = decodeOrThrow(Person, { name: "Name", age: 123 });
        expect(person).toEqual({ name: "Name", age: 123 });
    });

    it("should throw", () => {
        expect(() => {
            decodeOrThrow(Person, { name: "Name" });
        }).toThrowError("Invalid value");
    });
});
