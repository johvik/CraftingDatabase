import { readFileSync, writeFileSync } from "fs";
import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString";
import path from "path";
import { decodeOrThrow } from "../utils";
import { getItem } from "./wowapi";
import getRecipe from "./wowdb";
import { getAll } from "./wowhead";

const TItem = t.intersection([
  t.type({
    name: t.string,
    icon: t.string,
    updated: DateFromISOString,
  }),
  t.partial({
    price: t.number,
  }),
]);

const TRecipeItem = t.type({
  id: t.number,
  quantity: t.number,
});

const TRecipe = t.intersection([
  t.partial({
    crafts: TRecipeItem,
  }),
  t.type({
    name: t.string,
    icon: t.string,
    profession: t.string,
    reagents: t.array(TRecipeItem),
    updated: DateFromISOString,
  }),
]);

const TData = t.type({
  items: t.array(t.tuple([t.number, TItem])),
  recipes: t.array(t.tuple([t.number, TRecipe])),
});

interface StoredData {
  items: Map<number, t.TypeOf<typeof TItem>>;
  recipes: Map<number, t.TypeOf<typeof TRecipe>>;
}

export default class Data {
  private readonly file = path.join(__dirname, "..", "..", "data.json");

  private jsonCache = "{}";

  private data: StoredData = this.loadFromFile();

  private loadFromFile(): StoredData {
    try {
      this.jsonCache = readFileSync(this.file).toString();
      const storedData = decodeOrThrow(TData, JSON.parse(this.jsonCache));
      return {
        items: new Map(storedData.items),
        recipes: new Map(storedData.recipes),
      };
    } catch (error) {
      console.debug("Data#loadFromFile", error, new Date());
    }
    this.jsonCache = "{}";
    return {
      items: new Map(),
      recipes: new Map(),
    };
  }

  async update(accessToken: string) {
    try {
      const result = await getAll();
      const now = new Date();
      result.items.forEach((item, key) => {
        this.data.items.set(key, { ...{ updated: now }, ...item });
      });

      // Get recipes one at a time in sequence
      await [...result.recipes].reduce(async (promise, [key, recipe]) => {
        await promise;
        const oldRecipe = this.data.recipes.get(key);
        const oldCrafts = oldRecipe ? oldRecipe.crafts : undefined;
        const newRecipe = { ...{ updated: now }, ...recipe };

        // Update undefined crafts
        if (!newRecipe.crafts) {
          try {
            const r = await getRecipe(key);
            if (r.crafts.id !== 0) {
              newRecipe.crafts = {
                id: r.crafts.id,
                quantity: r.crafts.quantity,
              };
            }
          } catch (error) {
            console.debug(`Data#update undefined ${key}`, error, new Date());
            // Use the old crafts if possible
            if (oldCrafts) {
              newRecipe.crafts = oldCrafts;
            }
          }
        }
        this.data.recipes.set(key, newRecipe);
      }, Promise.resolve());

      // Update unknown items (and items not updated now) one at a time in sequence
      const values = [...this.data.recipes.values()];
      await values.reduce(async (promise, { crafts }) => {
        await promise;
        if (crafts) {
          const oldItem = this.data.items.get(crafts.id);
          if (!oldItem || oldItem.updated.getTime() !== now.getTime()) {
            const item = await getItem(crafts.id, accessToken);
            // Don't use the price here since the WOW APIs price information
            // seems to always be present
            this.data.items.set(crafts.id, {
              name: item.name,
              icon: item.icon,
              updated: now,
            });
          }
        }
      }, Promise.resolve());
    } catch (error) {
      console.debug("Data#update", error, new Date());
    }

    this.jsonCache = JSON.stringify({
      items: [...this.data.items],
      recipes: [...this.data.recipes],
    });
    writeFileSync(this.file, this.jsonCache);
  }

  itemIds() {
    const itemIds = new Set<number>();
    this.data.recipes.forEach((recipe) => {
      if (recipe.crafts && recipe.crafts.id !== 0) {
        itemIds.add(recipe.crafts.id);
      }
      recipe.reagents.forEach((reagent) => itemIds.add(reagent.id));
    });
    return itemIds;
  }

  json() {
    return this.jsonCache;
  }
}
