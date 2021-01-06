import dotenv from "dotenv";
import * as t from "io-ts";
import Region from "./region";
import { decodeOrThrow, fromEnum } from "./utils";

dotenv.config({ path: ".env" });

const ConnectedRealms = t.array(t.record(t.string, t.number));

const RegionEnum = fromEnum("Region", Region);

function parseConnectedRealms(text: string) {
  const records = decodeOrThrow(ConnectedRealms, JSON.parse(text));
  return records.map((record) => {
    const region = decodeOrThrow(RegionEnum, Object.keys(record)[0]);
    const connectedRealmId = record[region];
    return {
      connectedRealmId,
      region,
    };
  });
}

export const SERVER_PORT = parseInt(`${process.env.SERVER_PORT}`, 10);
export const { WOW_CLIENT_ID } = process.env;
export const { WOW_CLIENT_SECRET } = process.env;
export const { DB_HOST } = process.env;
export const DB_PORT = parseInt(`${process.env.DB_PORT}`, 10);
export const { DB_USERNAME } = process.env;
export const { DB_PASSWORD } = process.env;
export const { DB_DATABASE } = process.env;
export const CONNECTED_REALMS = parseConnectedRealms(
  `${process.env.CONNECTED_REALMS}`
);

if (
  Number.isNaN(SERVER_PORT) ||
  WOW_CLIENT_ID === undefined ||
  WOW_CLIENT_SECRET === undefined ||
  DB_HOST === undefined ||
  Number.isNaN(DB_PORT) ||
  DB_USERNAME === undefined ||
  DB_PASSWORD === undefined ||
  DB_DATABASE === undefined
) {
  console.error("Missing environment variables", new Date());
  process.exit(1);
}
