import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export default class Auction {
  // generatedConnectedRealmId is first to be first in the index
  @PrimaryColumn()
  // @ts-ignore
  generatedConnectedRealmId: number;

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
   * Assuming that +-1 copper is not interesting in the stats,
   * so the numbers are stored as whole integers
   */

  @Column("bigint")
  // @ts-ignore
  lowest: number;

  @Column("bigint")
  // @ts-ignore
  farOut: number; // Lowest price that is not "far out"

  @Column("bigint")
  // @ts-ignore
  outlier: number; // Lowest price that is not an outlier

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
