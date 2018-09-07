import "reflect-metadata";
import { createConnection } from "typeorm";
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from "./secrets";
import { Realm } from "./entity/Realm";
import { AuctionItem } from "./entity/AuctionItem";

export async function dummy() {
    const connection = await createConnection({
        type: "mysql",
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        entities: [Realm, AuctionItem],
        synchronize: true,
        logging: false
    });
    const realmRepository = connection.getRepository(Realm);
    const realm = realmRepository.create({ region: "eu", name: "draenor" });
    await realmRepository.save(realm);
    await connection.close();
}
