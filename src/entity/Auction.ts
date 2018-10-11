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

    @PrimaryColumn()
    // @ts-ignore
    lastUpdate: Date;

    @Column()
    // @ts-ignore
    quantity: number;

    /*
     * All columns below are price information
     *
     * Assuming that +-1 copper is not interesting in the stats, so the numbers are stored as whole integers
     */

    @Column("bigint")
    // @ts-ignore
    lowest: number;

    @Column("bigint")
    // @ts-ignore
    normal: number; // Lowest price that is not an outlier

    @Column("bigint")
    // @ts-ignore
    mean: number;

    @Column("bigint")
    // @ts-ignore
    firstQuartile: number;

    @Column("bigint")
    // @ts-ignore
    secondQuartile: number; // Same as median

    @Column("bigint")
    // @ts-ignore
    thirdQuartile: number;

    @Column("bigint")
    // @ts-ignore
    standardDeviation: number;
}
