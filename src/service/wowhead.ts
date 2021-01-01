import rp from "request-promise-native";
import * as t from "io-ts";
import { decodeOrThrow } from "../utils";

function parseWh(data: string) {
    const map = JSON.parse(data.substring(data.indexOf("{"), data.lastIndexOf("}") + 1));
    const result = [];
    for (let key in map) {
        result.push({ id: Number(key), data: map[key] });
    }
    return result;
}

const GItem = t.type({
    name_enus: t.string,
    icon: t.string,
    jsonequip: t.intersection([t.partial({ buyprice: t.number })])
});

const GSpell = t.type({
    name_enus: t.string,
    icon: t.string
});

const ListViewSpell = t.intersection([
    t.partial({
        creates: t.refinement(t.array(t.number), create => create.length === 3)
    }),
    t.type({
        id: t.number,
        reagents: t.refinement(t.array(t.refinement(t.array(t.number), reagent => reagent.length === 2)), reagents => reagents.length > 0)
    })
]);

type Item = {
    name: string,
    icon: string,
    price?: number
};

type Spell = {
    name: string,
    icon: string
};

type RecipeItem = {
    id: number,
    quantity: number
};

type Recipe = {
    crafts?: RecipeItem,
    name: string,
    icon: string,
    profession: string,
    reagents: RecipeItem[]
};

export function parsePage(content: string, profession: string) {
    const cdata = content.match(/\/\/<!\[CDATA\[[^]*WH\.Gatherer\.addData([^]*)WH\.Gatherer\.addData([^]*)var listviewspells = ([^]*);[^]*new Listview[^]*\/\/\]/);
    if (!cdata) {
        throw Error("CDATA not found");
    }
    const matched_items = cdata[1];
    const matched_spells = cdata[2];
    const matched_recpies = cdata[3]
        .replace(/,quality/g, ",\"quality\"")
        .replace(/,popularity/g, ",\"popularity\"");
    const recipes = JSON.parse(matched_recpies);

    const items = parseWh(matched_items);
    const spells = parseWh(matched_spells);

    const decodedItems: {
        [id: number]: Item | undefined
    } = {};
    for (const i of items) {
        const item = decodeOrThrow(GItem, i.data);
        decodedItems[i.id] = {
            name: item.name_enus,
            icon: item.icon,
            price: item.jsonequip.buyprice
        };
    }

    const decodedSpells: {
        [id: number]: Spell | undefined
    } = {};
    for (const i of spells) {
        const spell = decodeOrThrow(GSpell, i.data);
        decodedSpells[i.id] = {
            name: spell.name_enus,
            icon: spell.icon
        };
    }

    const decodedRecipes: {
        [id: number]: Recipe | undefined
    } = {};
    for (const i of recipes) {
        const recipe = decodeOrThrow(ListViewSpell, i);
        const spell = decodedSpells[i.id];
        if (!spell) {
            throw Error(`Matching spell not found ${i.id}`);
        }

        const crafts = recipe.creates ? {
            id: recipe.creates[0],
            quantity: recipe.creates[1]
        } : undefined;
        const reagents: RecipeItem[] = recipe.reagents.map((value) => {
            return {
                id: value[0],
                quantity: value[1]
            };
        });

        decodedRecipes[i.id] = {
            crafts: crafts,
            name: spell.name,
            icon: spell.icon,
            profession: profession,
            reagents: reagents
        };
    }

    return {
        items: decodedItems, recipes: decodedRecipes
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
    "tailoring"
];

export async function getAll() {
    let items: {
        [id: number]: Item | undefined
    } = {};
    let recipes: {
        [id: number]: Recipe | undefined
    } = {};
    for (const i of professions) {
        const category = i === "cooking" ? "secondary-skills" : "professions";
        const url = `https://www.wowhead.com/spells/${category}/${i}/live-only:on?filter=16:20;9:1;0:0`;
        const content = await rp.get(url, { timeout: 10000 });
        const data = parsePage(content, i);
        items = { ...items, ...data.items };
        recipes = { ...recipes, ...data.recipes };
    }

    return {
        items: items,
        recipes: recipes
    };
}