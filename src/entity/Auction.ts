import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Auction {
    // realmId is first to be first in the index
    @PrimaryColumn()
    // @ts-ignore
    realmId: number;

    @PrimaryColumn()
    // @ts-ignore
    id: number;

    @Column("bigint")
    // @ts-ignore
    lowestPrice: number;

    @Column("bigint")
    // @ts-ignore
    firstQuartile: number;

    @Column("bigint")
    // @ts-ignore
    secondQuartile: number; // Same as median

    @Column()
    // @ts-ignore
    quantity: number;

    @Column()
    // @ts-ignore
    lastUpdate: Date;
}
