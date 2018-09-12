import "reflect-metadata";
import { createConnection } from "typeorm";
import express from "express";
import compression from "compression";
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, SERVER_PORT } from "./secrets";
import { Realm } from "./entity/Realm";
import { Auction } from "./entity/Auction";
import { Recipes } from "./service/recipes";
import { Auctions } from "./service/auctions";
import { Items } from "./service/items";
import { CronJob } from "cron";

type Data = {
    recipes: Recipes,
    auctions: Auctions,
    items: Items
};

async function load(): Promise<Data> {
    await createConnection({
        type: "mysql",
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        entities: [Realm, Auction],
        synchronize: true,
        logging: false
    });
    console.info("Loading recipes", new Date());
    const recipes = new Recipes();
    console.info("Loading auctions", new Date());
    const auctions = new Auctions();
    console.info("Loading items", new Date());
    const items = new Items(recipes);
    return { recipes: recipes, auctions: auctions, items: items };
}

(async () => {
    const data = await load();

    const app = express();
    app.use(compression());

    app.get("/recipes", (_, res) => res.type("json").send(data.recipes.json()));
    app.get("/items", (_, res) => res.type("json").send(data.items.json()));
    app.get("/", (_, res) => res.send("Hello World!"));

    // TODO Get auctions, only recipe items?

    app.listen(SERVER_PORT, () => console.info("Express started", new Date()));

    console.info("Starting initial update", new Date());
    if (data.recipes.empty()) {
        await data.recipes.update();
    }
    await data.auctions.updateAll();
    await data.items.updateUnknown();

    console.info("Starting jobs", new Date());
    process.on("unhandledRejection", error => {
        console.error("unhandledRejection", error);
        process.exit(1);
    });
    new CronJob("00 30 02 * * *", async () => {
        await data.recipes.update();
        if (new Date().getDay() === 0) {
            // Full update once a week
            await data.items.updateAll();
        } else {
            await data.items.updateUnknown();
        }
    }).start();
    new CronJob("00 */5 * * * *", async () => {
        // TODO Check if previous job finished
        await data.auctions.updateAll();
    }).start();
    console.info("Jobs started", new Date());
})().catch(error => {
    console.error("Error from start", error, new Date());
});
