import {
  Entity, PrimaryColumn, Generated, Column, Index,
} from 'typeorm';
import { Region } from '../service/wowapi';

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
