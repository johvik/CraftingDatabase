import { Entity, PrimaryColumn, Generated, Column, Index } from "typeorm";

@Entity()
export class Realm {
    @Generated()
    @Index({ unique: true })
    @Column()
    // @ts-ignore
    id: number;

    @PrimaryColumn()
    // @ts-ignore
    region: string;

    @PrimaryColumn()
    // @ts-ignore
    name: string;
}
