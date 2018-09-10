import "reflect-metadata";
import { createConnection } from "typeorm";
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from "./secrets";
import { Realm } from "./entity/Realm";
import { Auction } from "./entity/Auction";
import { Recipes } from "./service/recipes";
import { Auctions } from "./service/auctions";
import { Items } from "./service/items";

async function start() {
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
    console.info("Loading recipes");
    const recipes = new Recipes();
    if (recipes.empty()) {
        await recipes.update();
    } else {
        console.info("Using existing recipes");
    }
    console.info("Loading auctions");
    const auctions = new Auctions();
    await auctions.updateAll();
    console.info("Loading items");
    const items = new Items();
    await items.updateUnknown(recipes);
}

start().then(() => {
    console.info("Started");
}).catch(error => {
    console.error("Error from start", error);
});
