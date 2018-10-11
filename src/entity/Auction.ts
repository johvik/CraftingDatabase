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
    normalPrice: number; // Lowest price that is not an outlier

    @Column("bigint")
    // @ts-ignore
    firstQuartile: number;

    @Column("bigint")
    // @ts-ignore
    secondQuartile: number; // Same as median

    @Column("bigint")
    // @ts-ignore
    thirdQuartile: number;

    @Column()
    // @ts-ignore
    quantity: number;

    @PrimaryColumn()
    // @ts-ignore
    lastUpdate: Date;
}
