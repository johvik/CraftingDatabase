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
    if (recipes.empty()) {
        await recipes.update();
    } else {
        console.info("Using existing recipes");
    }
    console.info("Loading auctions", new Date());
    const auctions = new Auctions();
    await auctions.updateAll();
    console.info("Loading items", new Date());
    const items = new Items();
    await items.updateUnknown(recipes);
    return { recipes: recipes, auctions: auctions, items: items };
}

load().then((data) => {
    console.info("Loaded", new Date());

    const app = express();
    app.use(compression());

    app.get("/recipes", (_, res) => res.type("json").send(data.recipes.json()));
    app.get("/items", (_, res) => res.type("json").send(data.items.json()));
    app.get("/", (_, res) => res.send("Hello World!"));

    // TODO Get auctions, only recipe items?

    app.listen(SERVER_PORT, () => console.info("Started", new Date()));

    // TODO Schedule updates
}).catch(error => {
    console.error("Error from start", error, new Date());
});
