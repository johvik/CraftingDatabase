import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const WOW_API_KEY = process.env["WOW_API_KEY"];
export const DB_HOST = process.env["DB_HOST"];
export const DB_PORT = parseInt(process.env["DB_PORT"] + "");
export const DB_USERNAME = process.env["DB_USERNAME"];
export const DB_PASSWORD = process.env["DB_PASSWORD"];
export const DB_DATABASE = process.env["DB_DATABASE"];

if (!WOW_API_KEY || !DB_HOST || isNaN(DB_PORT) || !DB_USERNAME || !DB_PASSWORD || !DB_DATABASE) {
    console.error("Missing environment variables.");
    process.exit(1);
}
