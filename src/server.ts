import compression from "compression";
import { CronJob } from "cron";
import express from "express";
import { readFileSync } from "fs";
import { createServer } from "https";
import path from "path";
import "reflect-metadata";
import { createConnection } from "typeorm";
import Auction from "./entity/Auction";
import ConnectedRealm from "./entity/ConnectedRealm";
import Region from "./region";
import {
  CONNECTED_REALMS,
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
  SERVER_PORT,
} from "./secrets";
import Auctions from "./service/auctions";
import Data from "./service/data";
import { getAccessToken } from "./service/wowapi";

async function load() {
  await createConnection({
    type: "mysql",
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    entities: [ConnectedRealm, Auction],
    synchronize: true,
    logging: false,
  });
  console.info("Loading data", new Date());
  const data = new Data();
  console.info("Loading auctions", new Date());
  const auctions = new Auctions();
  return { data, auctions };
}

(async () => {
  process.on("unhandledRejection", (error) => {
    console.error("unhandledRejection", error);
    process.exit(1);
  });
  const data = await load();

  const app = express();
  app.use(compression());

  app.get("/api/data", (_, res) => res.type("json").send(data.data.json()));
  app.get(
    "/api/auctions/:generatedConnectedRealmId(\\d+)",
    async (req, res) => {
      try {
        const auctions = await data.auctions.json(
          parseInt(req.params.generatedConnectedRealmId, 10),
          data.data
        );
        return res.type("json").send(auctions);
      } catch (_) {
        return res.sendStatus(404);
      }
    }
  );
  app.get("/api/auctions/lastUpdate", async (_, res) =>
    res.type("json").send(data.auctions.lastUpdate())
  );
  app.use(express.static(path.join(__dirname, "..", "static")));

  const options = {
    key: readFileSync(path.join(__dirname, "..", "key.pem")),
    cert: readFileSync(path.join(__dirname, "..", "certificate.pem")),
  };
  createServer(options, app).listen(SERVER_PORT, () =>
    console.info("Express started", new Date())
  );

  // Add connected realms during startup
  for (const connectedRealm of CONNECTED_REALMS) {
    await Auctions.storeConnectedRealm(
      connectedRealm.connectedRealmId,
      connectedRealm.region
    );
  }

  console.info("Starting initial update", new Date());
  // TODO Update access token periodically
  const accessToken = await getAccessToken(Region.EU);
  await data.data.update(accessToken);
  await Auctions.deleteOld();
  await data.auctions.updateAll(accessToken);

  console.info("Starting jobs", new Date());
  new CronJob("00 30 02 * * *", async () => {
    await Auctions.deleteOld();
    await data.data.update(accessToken);
  }).start();
  new CronJob("00 */5 * * * *", async () => {
    await data.auctions.updateAll(accessToken);
  }).start();
  console.info("Jobs started", new Date());
})().catch((error) => {
  console.error("Error from start", error, new Date());
  process.exit(1);
});
