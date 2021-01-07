import { Column, Entity, Generated, Index, PrimaryColumn } from "typeorm";
import Region from "../region";

@Entity()
export default class ConnectedRealm {
  @Generated()
  @Index({ unique: true })
  @Column()
  // @ts-ignore
  id: number;

  @PrimaryColumn()
  // @ts-ignore
  connectedRealmId: number;

  @PrimaryColumn()
  // @ts-ignore
  region: Region;
}
