import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class AuctionItem {
    // realmId is first to be first in the index
    @PrimaryColumn()
    // @ts-ignore
    realmId: number;

    @PrimaryColumn()
    // @ts-ignore
    id: number;
}
