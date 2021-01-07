import * as t from "io-ts";
import {
  decodeOrThrow,
  delay,
  fetchWithTimeout,
  fromEnum,
  getMean,
  getQuartile,
  getStandardDeviation,
  getTotalCount,
  MergedValue,
} from "../src/utils";

describe("decodeOrThrow", () => {
  const Person = t.type({
    name: t.string,
    age: t.number,
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

describe("fromEnum", () => {
  enum TestEnum {
    FOO = "foo",
    BAR = "bar",
  }

  const TTestEnums = t.array(fromEnum("TestEnum", TestEnum));

  it("should decode", () => {
    const testEnums = decodeOrThrow(TTestEnums, ["foo", "bar", "foo"]);
    expect(testEnums).toEqual([TestEnum.FOO, TestEnum.BAR, TestEnum.FOO]);
  });

  it("should throw", () => {
    expect(() => {
      decodeOrThrow(TTestEnums, ["foo", "bar2"]);
    }).toThrowError("Invalid value");
  });
});

describe("fetchWithTimeout", () => {
  it("should fetch google", async () => {
    const res = await fetchWithTimeout("http://www.google.com", 5000);
    expect(res.text.length).toBeGreaterThanOrEqual(1000);
  });
});

describe("getTotalCount", () => {
  it("should count no items", () => {
    const values: MergedValue[] = [];
    expect(getTotalCount(values)).toEqual(0);
  });

  it("should count one item", () => {
    const values = [{ value: 42, count: 1 }];
    expect(getTotalCount(values)).toEqual(1);
  });

  it("should count multiple items", () => {
    const values = [
      { value: 42, count: 1 },
      { value: 1, count: 1 },
      { value: 4, count: 1 },
    ];
    expect(getTotalCount(values)).toEqual(3);
  });

  it("should count multiple items with count > 1", () => {
    const values = [
      { value: 42, count: 5 },
      { value: 1, count: 10 },
      { value: 4, count: 900 },
    ];
    expect(getTotalCount(values)).toEqual(915);
  });
});

describe("getQuartile", () => {
  it("should not handle empty arrays", () => {
    const values: MergedValue[] = [];
    expect(() => {
      getQuartile(values, getTotalCount(values));
    }).toThrowError("Cannot read property");
  });

  it("should handle one item", () => {
    const values = [{ value: 42, count: 1 }];
    const quartile = getQuartile(values, getTotalCount(values));
    expect(quartile).toEqual({ first: 42, second: 42, third: 42 });
  });

  it("should handle even number of items", () => {
    const values = [
      { value: 3, count: 1 },
      { value: 6, count: 1 },
      { value: 7, count: 1 },
      { value: 8, count: 1 },
      { value: 8, count: 1 },
      { value: 10, count: 1 },
      { value: 13, count: 1 },
      { value: 15, count: 1 },
      { value: 16, count: 1 },
      { value: 20, count: 1 },
    ];
    const quartile = getQuartile(values, getTotalCount(values));
    // TODO Second should really be 9 here (8+10)/2
    expect(quartile).toEqual({ first: 7, second: 8, third: 15 });
  });

  it("should handle odd number of items", () => {
    const values = [
      { value: 3, count: 1 },
      { value: 6, count: 1 },
      { value: 7, count: 1 },
      { value: 8, count: 1 },
      { value: 8, count: 1 },
      { value: 9, count: 1 },
      { value: 10, count: 1 },
      { value: 13, count: 1 },
      { value: 15, count: 1 },
      { value: 16, count: 1 },
      { value: 20, count: 1 },
    ];
    const quartile = getQuartile(values, getTotalCount(values));
    expect(quartile).toEqual({ first: 7, second: 9, third: 15 });
  });

  it("should handle one item with count > 1", () => {
    const values = [{ value: 42, count: 95 }];
    const quartile = getQuartile(values, getTotalCount(values));
    expect(quartile).toEqual({ first: 42, second: 42, third: 42 });
  });

  it("should handle two items with count > 1", () => {
    const values = [
      { value: 3, count: 1 },
      { value: 20, count: 4 },
    ];
    const quartile = getQuartile(values, getTotalCount(values));
    expect(quartile).toEqual({ first: 20, second: 20, third: 20 });
  });

  it("should handle items with count > 1", () => {
    const values = [
      { value: 3, count: 1 },
      { value: 6, count: 1 },
      { value: 7, count: 1 },
      { value: 8, count: 2 },
      { value: 20, count: 3 },
    ];
    const quartile = getQuartile(values, getTotalCount(values));
    expect(quartile).toEqual({ first: 6, second: 8, third: 20 });
  });
});

describe("getMean", () => {
  it("should work", () => {
    const values = [
      { value: 4, count: 1 },
      { value: 36, count: 1 },
      { value: 45, count: 1 },
      { value: 50, count: 1 },
      { value: 75, count: 1 },
    ];
    const totalCount = getTotalCount(values);
    const mean = getMean(values, totalCount);
    expect(mean).toEqual(42);
  });
});

describe("getStandardDeviation", () => {
  it("should work", () => {
    const values = [
      { value: 2, count: 1 },
      { value: 4, count: 1 },
      { value: 4, count: 1 },
      { value: 4, count: 1 },
      { value: 5, count: 1 },
      { value: 5, count: 1 },
      { value: 7, count: 1 },
      { value: 9, count: 1 },
    ];
    const totalCount = getTotalCount(values);
    const mean = getMean(values, totalCount);
    const standardDeviation = getStandardDeviation(values, mean, totalCount);
    expect(standardDeviation).toEqual(2);
  });
});

describe("delay", () => {
  it("should not delay with negative numbers", async () => {
    const start = new Date().getTime();
    await delay(-1);
    const diff = new Date().getTime() - start;
    expect(diff).toBeLessThan(50);
  });

  it("should delay zero", async () => {
    const start = new Date().getTime();
    await delay(0);
    const diff = new Date().getTime() - start;
    expect(diff).toBeLessThan(50);
  });

  it("should delay 500 ms", async () => {
    const start = new Date().getTime();
    await delay(500);
    const diff = new Date().getTime() - start;
    expect(diff).toBeGreaterThanOrEqual(500);
    expect(diff).toBeLessThan(550);
  });
});
