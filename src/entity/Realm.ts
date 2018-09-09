import { Entity, PrimaryColumn, Generated, Column, Index } from "typeorm";
import { Region } from "../service/wowapi";

@Entity()
export class Realm {
    @Generated()
    @Index({ unique: true })
    @Column()
    // @ts-ignore
    id: number;

    @PrimaryColumn()
    // @ts-ignore
    region: Region;

    @PrimaryColumn()
    // @ts-ignore
    name: string;
}
