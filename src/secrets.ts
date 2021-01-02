import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const SERVER_PORT = parseInt(`${process.env.SERVER_PORT}`, 10);
export const { WOW_API_KEY } = process.env;
export const { DB_HOST } = process.env;
export const DB_PORT = parseInt(`${process.env.DB_PORT}`, 10);
export const { DB_USERNAME } = process.env;
export const { DB_PASSWORD } = process.env;
export const { DB_DATABASE } = process.env;

if (Number.isNaN(SERVER_PORT)
  || WOW_API_KEY === undefined
  || DB_HOST === undefined
  || Number.isNaN(DB_PORT)
  || DB_USERNAME === undefined
  || DB_PASSWORD === undefined
  || DB_DATABASE === undefined) {
  console.error('Missing environment variables', new Date());
  process.exit(1);
}
