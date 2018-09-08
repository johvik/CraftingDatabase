import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

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

    @UpdateDateColumn()
    // @ts-ignore
    lastUpdate: Date;
}
