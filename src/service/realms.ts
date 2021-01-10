import { getRepository } from "typeorm";
import ConnectedRealm from "../entity/ConnectedRealm";
import { getConnectedRealms } from "./wowapi";

export default class Realms {
  private names = new Map<number, string[]>();

  async update(accessToken: string) {
    const repository = getRepository(ConnectedRealm);
    const result = await repository.find();

    // Update one at a time in sequence
    await result.reduce(async (promise, i) => {
      await promise;
      try {
        const connectedRealms = await getConnectedRealms(
          i.region,
          i.connectedRealmId,
          accessToken
        );

        this.names.set(i.id, connectedRealms);
      } catch (error) {
        console.debug("Realms#update", error, new Date());
      }
    }, Promise.resolve());
  }

  get(generatedConnectedRealmId: number) {
    return this.names.get(generatedConnectedRealmId);
  }
}
