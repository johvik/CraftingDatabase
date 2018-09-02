import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const WOW_API_KEY = process.env["WOW_API_KEY"];

if (!WOW_API_KEY) {
    console.error("No API key. Set WOW_API_KEY environment variable or create .env.");
    process.exit(1);
}
