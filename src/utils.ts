import * as t from "io-ts";
import { failure } from "io-ts/lib/PathReporter";

export function NeverUndefined<T>(item: T | undefined): T {
    return item as T;
}

export function decodeOrThrow<A, O>(type: t.Type<A,
    O>, value: t.mixed): A {
    return type.decode(value).getOrElseL(errors => {
        throw new Error(failure(errors).join());
    });
}

export type MergedValue = {
    value: number,
    count: number
};

export function getTotalCount(values: MergedValue[]) {
    return values.reduce((sum, i) => sum + i.count, 0);
}

export function getQuartile(values: MergedValue[], totalCount: number) {
    // Assumes sorted input
    const first = totalCount / 4;
    const second = totalCount / 2;
    const third = (3 * totalCount) / 4;
    let sum = 0;
    let i = 0;
    for (; sum < first; i++) {
        sum += values[i].count;
    }
    const firstQuartile = values[i - 1].value;

    for (; sum < second; i++) {
        sum += values[i].count;
    }
    const secondQuartile = values[i - 1].value;

    for (; sum < third; i++) {
        sum += values[i].count;
    }
    const thirdQuartile = values[i - 1].value;

    return {
        first: firstQuartile,
        second: secondQuartile,
        third: thirdQuartile
    };
}

export function getMean(values: MergedValue[], totalCount: number): number {
    return values.reduce((sum, value) => {
        return sum + (value.value * value.count);
    }, 0) / totalCount;
}

export function getStandardDeviation(values: MergedValue[], mean: number, totalCount: number): number {
    const variance = values.reduce((sum, value) => {
        const diff = value.value - mean;
        return sum + ((diff * diff) * value.count);
    }, 0) / totalCount;
    return Math.sqrt(variance);
}

export async function delay(milliseconds: number): Promise<void> {
    if (milliseconds > 0) {
        return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
    }
}
