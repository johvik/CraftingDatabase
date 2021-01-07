import { getRepository } from "typeorm";
import Auction from "../entity/Auction";
import ConnectedRealm from "../entity/ConnectedRealm";
import Region from "../region";
import {
  getMean,
  getQuartile,
  getStandardDeviation,
  getTotalCount,
  MergedValue,
} from "../utils";
import Data from "./data";
import { getAuctionData } from "./wowapi";

type LastUpdateInfo = {
  lastAttempt: Date;
  lastModified: Date;
  cache: string;
};

export default class Auctions {
  private updating = false;

  private lastUpdates = new Map<number, LastUpdateInfo>();

  static async storeConnectedRealm(
    connectedRealmId: number,
    region: Region
  ): Promise<number> {
    const repository = getRepository(ConnectedRealm);
    const connectedRealm = {
      connectedRealmId,
      region,
    };
    const result = await repository.findOne(connectedRealm);
    if (result) {
      return result.id;
    }
    const newRealm = repository.create(connectedRealm);
    return (await repository.save(newRealm)).id;
  }

  private static async storeAuctionData(
    generatedConnectedRealmId: number,
    lastModified: Date,
    data: Map<number, MergedValue[]>
  ) {
    const repository = getRepository(Auction);
    const auctions: Auction[] = [];
    for (const [id, values] of data) {
      values.sort((a, b) => a.value - b.value);
      const lowestPrice = values[0].value;
      const totalCount = getTotalCount(values);
      const quartile = getQuartile(values, totalCount);

      const irq = quartile.third - quartile.first;
      const farOutLowerFence = quartile.first - 3 * irq;
      const firstNonFarOut = values.find(
        (value) => value.value >= farOutLowerFence
      );
      const outlierLowerFence = quartile.first - 1.5 * irq;
      const firstNonOutlier = values.find(
        (value) => value.value >= outlierLowerFence
      );

      const farOutPrice = firstNonFarOut ? firstNonFarOut.value : lowestPrice;
      const outlierPrice = firstNonOutlier
        ? firstNonOutlier.value
        : lowestPrice;

      const meanPrice = getMean(values, totalCount);
      const standardDeviation = getStandardDeviation(
        values,
        meanPrice,
        totalCount
      );

      const auction = repository.create({
        generatedConnectedRealmId,
        id,
        lastUpdate: lastModified,
        quantity: totalCount,
        lowest: lowestPrice,
        farOut: farOutPrice,
        outlier: outlierPrice,
        standardDeviation,
        mean: meanPrice,
        firstQuartile: quartile.first,
        secondQuartile: quartile.second,
        thirdQuartile: quartile.third,
      });
      auctions.push(auction);
    }
    await repository.save(auctions, {
      chunk: Math.max(1, Math.ceil(auctions.length / 1000)),
    });
  }

  private async updateAuctionData(
    connectedRealm: ConnectedRealm,
    accessToken: string
  ) {
    const lastUpdate = this.lastUpdates.get(connectedRealm.id);
    const data = await getAuctionData(
      connectedRealm.region,
      connectedRealm.connectedRealmId,
      accessToken
    );

    const now = new Date();
    const lastModifiedOrNow =
      data.lastModified !== undefined ? data.lastModified : now;

    if (
      !lastUpdate ||
      lastUpdate.lastModified.getTime() < lastModifiedOrNow.getTime()
    ) {
      // Merge items with the same id
      const map = new Map<number, MergedValue[]>();
      for (const i of data.auctions) {
        let unitPrice = 0;
        if ("buyout" in i) {
          unitPrice = i.buyout / i.quantity;
        } else if ("unit_price" in i) {
          unitPrice = i.unit_price;
        }

        if (unitPrice !== 0) {
          // Skip items without a buyout
          const value = map.get(i.item.id);
          const mergedValue = { value: unitPrice, count: i.quantity };
          if (value) {
            value.push(mergedValue);
          } else {
            map.set(i.item.id, [mergedValue]);
          }
        }
      }
      await Auctions.storeAuctionData(
        connectedRealm.id,
        lastModifiedOrNow,
        map
      );

      this.lastUpdates.set(connectedRealm.id, {
        lastAttempt: now,
        lastModified: lastModifiedOrNow,
        cache: "",
      });
    } else if (lastUpdate) {
      lastUpdate.lastAttempt = now;
    }
  }

  async updateAll(accessToken: string) {
    if (this.updating) {
      console.log("Auctions#updateAll", "already updating", new Date());
    } else {
      this.updating = true;
      const connectedRealms = await getRepository(ConnectedRealm).find();
      for (const i of connectedRealms) {
        try {
          await this.updateAuctionData(i, accessToken);
        } catch (error) {
          console.debug("Auctions#updateAll", error, new Date());
        }
      }
      this.updating = false;
    }
  }

  static async deleteOld() {
    try {
      await getRepository(Auction)
        .createQueryBuilder()
        .delete()
        .where("lastUpdate < :date", {
          date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
        })
        .execute();
    } catch (error) {
      console.debug("Auctions#deleteOld", error, new Date());
    }
  }

  async json(generatedConnectedRealmId: number, data: Data): Promise<string> {
    const lastUpdate = this.lastUpdates.get(generatedConnectedRealmId);
    if (lastUpdate) {
      if (lastUpdate.cache !== "") {
        return lastUpdate.cache;
      }

      // Fetch auctions and save to cache
      const auctions = await getRepository(Auction)
        .createQueryBuilder("auction")
        .select("auction.id", "id")
        .addSelect("auction.quantity", "quantity")
        .addSelect("auction.lastUpdate", "lastUpdate")
        .addSelect("auction.lowest", "lowest")
        .addSelect("auction.farOut", "farOut")
        .addSelect("auction.outlier", "outlier")
        .addSelect("auction.mean", "mean")
        .addSelect("auction.firstQuartile", "firstQuartile")
        .addSelect("auction.secondQuartile", "secondQuartile")
        .addSelect("auction.thirdQuartile", "thirdQuartile")
        .addSelect("auction.standardDeviation", "standardDeviation")
        .where(
          "auction.generatedConnectedRealmId = :generatedConnectedRealmId",
          { generatedConnectedRealmId }
        )
        .andWhere("auction.id IN (:itemIds)", { itemIds: [...data.itemIds()] })
        .orderBy("lastUpdate", "ASC")
        .getRawMany();

      lastUpdate.cache = JSON.stringify({
        lastModified: lastUpdate.lastModified,
        auctions,
      });
      return lastUpdate.cache;
    }
    throw new Error(`Auctions#json ${generatedConnectedRealmId} not found`);
  }

  lastUpdate() {
    return Array.from(this.lastUpdates.entries()).map((p) => ({
      id: p["0"],
      lastAttempt: p["1"].lastAttempt,
      lastModified: p["1"].lastModified,
    }));
  }
}
