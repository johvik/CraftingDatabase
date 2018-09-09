import * as t from "io-ts";
import { failure } from "io-ts/lib/PathReporter";

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

    return {
        first: firstQuartile,
        second: secondQuartile
    };
}

export async function delay(milliseconds: number): Promise<void> {
    if (milliseconds > 0) {
        return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
    }
}
