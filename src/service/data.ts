import * as t from 'io-ts';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { DateFromISOString } from 'io-ts-types/lib/DateFromISOString';
import { getAll } from './wowhead';
import { decodeOrThrow, NeverUndefined } from '../utils';
import getRecipe from './wowdb';
import { getItem } from './wowapi';

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
  items: t.dictionary(t.refinement(t.string, (key) => /^\d+$/.test(key)), t.union([TItem, t.undefined])),
  recipes: t.dictionary(t.refinement(t.string, (key) => /^\d+$/.test(key)), t.union([TRecipe, t.undefined])),
});

type IData = t.TypeOf<typeof TData>;

export default class Data {
  private readonly file = path.join(__dirname, '..', '..', 'data.json');

  private jsonCache = '{}';

  private data: IData = this.loadFromFile();

  private loadFromFile(): IData {
    try {
      this.jsonCache = readFileSync(this.file).toString();
      return decodeOrThrow(TData, JSON.parse(this.jsonCache));
    } catch (error) {
      console.debug('Data#loadFromFile', error, new Date());
    }
    return {
      items: {},
      recipes: {},
    };
  }

  async update() {
    try {
      const result = await getAll();
      const now = new Date();
      for (const i in result.items) {
        const item = NeverUndefined(result.items[i]);
        this.data.items[i] = { ...{ updated: now }, ...item };
      }
      for (const i in result.recipes) {
        const recipe = NeverUndefined(result.recipes[i]);
        const oldRecipe = this.data.recipes[i];
        const oldCrafts = oldRecipe ? oldRecipe.crafts : undefined;
        const newRecipe = { ...{ updated: now }, ...recipe };

        // Update undefined crafts
        if (!newRecipe.crafts) {
          try {
            const r = await getRecipe(Number(i));
            if (r.crafts.id !== 0) {
              newRecipe.crafts = {
                id: r.crafts.id,
                quantity: r.crafts.quantity,
              };
            }
          } catch (error) {
            console.debug(`Data#update undefined ${i}`, error, new Date());
            // Use the old crafts if possible
            if (oldCrafts) {
              newRecipe.crafts = oldCrafts;
            }
          }
        }
        this.data.recipes[i] = newRecipe;
      }

      // Update unknown items (and items not updated now)
      for (const i in this.data.recipes) {
        const { crafts } = NeverUndefined(this.data.recipes[i]);
        if (crafts) {
          const oldItem = this.data.items[crafts.id];
          if (!oldItem || oldItem.updated.getTime() !== now.getTime()) {
            const item = await getItem(crafts.id);
            this.data.items[crafts.id] = {
              name: item.name,
              icon: item.icon,
              updated: now,
            };
          }
        }
      }
    } catch (error) {
      console.debug('Data#update', error, new Date());
    }

    this.jsonCache = JSON.stringify(this.data);
    writeFileSync(this.file, this.jsonCache);
  }

  itemIds() {
    const itemIds = new Set<number>();
    for (const i in this.data.recipes) {
      const recipe = NeverUndefined(this.data.recipes[i]);
      if (recipe.crafts && recipe.crafts.id !== 0) {
        itemIds.add(recipe.crafts.id);
      }
      for (const reagent of recipe.reagents) {
        itemIds.add(reagent.id);
      }
    }
    return itemIds;
  }

  json() {
    return this.jsonCache;
  }
}
