import { AbortController } from "abort-controller";
import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { failure } from "io-ts/lib/PathReporter";
import fetch, { RequestInit } from "node-fetch";

export function NeverUndefined<T>(item: T | undefined): T {
  return item as T;
}

export function decodeOrThrow<A, O>(type: t.Type<A, O>, value: t.mixed): A {
  const decoded = type.decode(value);
  if (isLeft(decoded)) {
    throw new Error(failure(decoded.left).join());
  }
  return decoded.right;
}

// From https://github.com/gcanti/io-ts/issues/216
export function fromEnum<EnumType extends string>(
  enumName: string,
  theEnum: Record<string, EnumType>
): t.Type<EnumType, EnumType, unknown> {
  const isEnumValue = (input: unknown): input is EnumType =>
    Object.values<unknown>(theEnum).includes(input);

  return new t.Type<EnumType>(
    enumName,
    isEnumValue,
    (input, context) =>
      isEnumValue(input) ? t.success(input) : t.failure(input, context),
    t.identity
  );
}

interface FetchResult {
  text: string;
  lastModified?: Date;
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal, ...init });
    const text = await res.text();
    const lastModifiedHeader = res.headers.get("Last-Modified");
    const lastModified =
      lastModifiedHeader !== null ? new Date(lastModifiedHeader) : undefined;
    return { text, lastModified };
  } finally {
    clearTimeout(timeout);
  }
}

export type MergedValue = {
  value: number;
  count: number;
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
  for (; sum < first; i += 1) {
    sum += values[i].count;
  }
  const firstQuartile = values[i - 1].value;

  for (; sum < second; i += 1) {
    sum += values[i].count;
  }
  const secondQuartile = values[i - 1].value;

  for (; sum < third; i += 1) {
    sum += values[i].count;
  }
  const thirdQuartile = values[i - 1].value;

  return {
    first: firstQuartile,
    second: secondQuartile,
    third: thirdQuartile,
  };
}

export function getMean(values: MergedValue[], totalCount: number): number {
  return (
    values.reduce((sum, value) => sum + value.value * value.count, 0) /
    totalCount
  );
}

export function getStandardDeviation(
  values: MergedValue[],
  mean: number,
  totalCount: number
): number {
  const variance =
    values.reduce((sum, value) => {
      const diff = value.value - mean;
      return sum + diff * diff * value.count;
    }, 0) / totalCount;
  return Math.sqrt(variance);
}

export async function delay(milliseconds: number): Promise<void> {
  if (milliseconds > 0) {
    return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }
  return new Promise<void>((resolve) => resolve());
}
