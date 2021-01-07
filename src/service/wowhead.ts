import * as t from "io-ts";
import { decodeOrThrow, fetchWithTimeout } from "../utils";

function parseWh(data: string) {
  const object = JSON.parse(
    data.substring(data.indexOf("{"), data.lastIndexOf("}") + 1)
  );
  return Object.keys(object).map((key) => {
    return { id: Number(key), data: object[key] };
  });
}

const GItem = t.type({
  name_enus: t.string,
  icon: t.string,
  jsonequip: t.partial({ buyprice: t.number }),
});

const GSpell = t.type({
  name_enus: t.string,
  icon: t.string,
});

const ListViewSpell = t.intersection([
  t.partial({
    creates: t.refinement(t.array(t.number), (create) => create.length === 3),
  }),
  t.type({
    id: t.number,
    reagents: t.refinement(
      t.array(
        t.refinement(t.array(t.number), (reagent) => reagent.length === 2)
      ),
      (reagents) => reagents.length > 0
    ),
  }),
]);

type Item = {
  name: string;
  icon: string;
  price?: number;
};

type Spell = {
  name: string;
  icon: string;
};

type RecipeItem = {
  id: number;
  quantity: number;
};

type Recipe = {
  crafts?: RecipeItem;
  name: string;
  icon: string;
  profession: string;
  reagents: RecipeItem[];
};

export function parsePage(content: string, profession: string) {
  const cdata = content.match(
    /\/\/<!\[CDATA\[[^]*WH\.Gatherer\.addData([^]*)WH\.Gatherer\.addData([^]*)var listviewspells = ([^]*);[^]*new Listview[^]*\/\/\]/
  );
  if (!cdata) {
    throw Error("CDATA not found");
  }
  const matchedItems = cdata[1];
  const matchedSpells = cdata[2];
  const matchedRecpies = cdata[3]
    .replace(/,quality/g, ',"quality"')
    .replace(/,popularity/g, ',"popularity"');
  const recipes = JSON.parse(matchedRecpies);

  const items = parseWh(matchedItems);
  const spells = parseWh(matchedSpells);

  const decodedItems = new Map<number, Item>(
    items.map((i) => {
      const item = decodeOrThrow(GItem, i.data);
      return [
        i.id,
        {
          name: item.name_enus,
          icon: item.icon,
          price: item.jsonequip.buyprice,
        },
      ];
    })
  );

  const decodedSpells = new Map(
    spells.map((i) => {
      const spell = decodeOrThrow(GSpell, i.data);
      return [
        i.id,
        <Spell>{
          name: spell.name_enus,
          icon: spell.icon,
        },
      ];
    })
  );

  const decodedRecipes = new Map<number, Recipe>(
    recipes.map((i: any) => {
      const recipe = decodeOrThrow(ListViewSpell, i);
      const spell = decodedSpells.get(recipe.id);
      if (!spell) {
        throw Error(`Matching spell not found ${recipe.id}`);
      }

      const crafts = recipe.creates
        ? {
            id: recipe.creates[0],
            quantity: recipe.creates[1],
          }
        : undefined;
      const reagents: RecipeItem[] = recipe.reagents.map((value) => ({
        id: value[0],
        quantity: value[1],
      }));

      return [
        recipe.id,
        {
          crafts,
          name: spell.name,
          icon: spell.icon,
          profession,
          reagents,
        },
      ];
    })
  );

  return {
    items: decodedItems,
    recipes: decodedRecipes,
  };
}

const professions = [
  "alchemy",
  "blacksmithing",
  "cooking",
  "enchanting",
  "engineering",
  "inscription",
  "jewelcrafting",
  "leatherworking",
  "tailoring",
];

export async function getAll() {
  const allItems = new Map<number, Item>();
  const allRecipes = new Map<number, Recipe>();

  // Fetch one at a time in sequence
  await professions.reduce(async (promise, i) => {
    await promise;
    const category = i === "cooking" ? "secondary-skills" : "professions";
    const url = `https://www.wowhead.com/spells/${category}/${i}/live-only:on?filter=16:20;9:1;0:0`;
    const res = await fetchWithTimeout(url, 5000);
    const data = parsePage(res.text, i);
    data.items.forEach((value, key) => allItems.set(key, value));
    data.recipes.forEach((value, key) => allRecipes.set(key, value));
  }, Promise.resolve());

  return {
    items: allItems,
    recipes: allRecipes,
  };
}
