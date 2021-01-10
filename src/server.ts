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
import AccessToken from "./service/accessToken";
import Auctions from "./service/auctions";
import Data from "./service/data";
import Realms from "./service/realms";

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
  const accessToken = new AccessToken(Region.EU);
  const data = new Data();
  const auctions = new Auctions();
  const realms = new Realms();

  // Wait for the initial token
  await accessToken.schedule();

  return { accessToken, data, auctions, realms };
}

(async () => {
  process.on("unhandledRejection", (error) => {
    console.error("unhandledRejection", error);
    process.exit(1);
  });
  const service = await load();

  const app = express();
  app.use(compression());

  app.get("/api/data", (_, res) => res.type("json").send(service.data.json()));
  app.get(
    "/api/auctions/:generatedConnectedRealmId(\\d+)",
    async (req, res) => {
      try {
        const auctions = await service.auctions.json(
          parseInt(req.params.generatedConnectedRealmId, 10),
          service.data
        );
        return res.type("json").send(auctions);
      } catch (_) {
        return res.sendStatus(404);
      }
    }
  );
  app.get("/api/auctions/lastUpdate", (_, res) =>
    res.type("json").send(service.auctions.lastUpdate())
  );
  app.get(
    "/api/connectedRealms/:generatedConnectedRealmId(\\d+)",
    (req, res) => {
      const connectedRealms = service.realms.get(
        parseInt(req.params.generatedConnectedRealmId, 10)
      );
      if (connectedRealms !== undefined) {
        return res.type("json").send(connectedRealms);
      }
      return res.sendStatus(404);
    }
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
  await Promise.all(
    CONNECTED_REALMS.map(async (connectedRealm) => {
      await Auctions.storeConnectedRealm(
        connectedRealm.connectedRealmId,
        connectedRealm.region
      );
    })
  );

  console.info("Starting initial update", new Date());
  await service.realms.update(service.accessToken.get());
  await service.data.update(service.accessToken.get());
  await Auctions.deleteOld();
  await service.auctions.updateAll(service.accessToken.get());

  console.info("Starting jobs", new Date());
  new CronJob("00 30 02 * * *", async () => {
    await service.realms.update(service.accessToken.get());
    await Auctions.deleteOld();
    await service.data.update(service.accessToken.get());
  }).start();
  new CronJob("00 */5 * * * *", async () => {
    await service.auctions.updateAll(service.accessToken.get());
  }).start();
  console.info("Jobs started", new Date());
})().catch((error) => {
  console.error("Error from start", error, new Date());
  process.exit(1);
});
