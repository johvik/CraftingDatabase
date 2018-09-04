import * as t from "io-ts";
import { failure } from "io-ts/lib/PathReporter";

export function decodeOrThrow<A, O>(type: t.Type<A,
    O>, value: t.mixed): A {
    return type.decode(value).getOrElseL(errors => {
        throw new Error(failure(errors).join());
    });
}
