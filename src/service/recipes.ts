import * as t from "io-ts";
import { readFileSync, writeFileSync } from "fs";
import { DateFromISOString } from "io-ts-types/lib/Date/DateFromISOString";
import { getRecipesIds, getRecipe } from "./wowdb";
import { decodeOrThrow } from "../utils";

const Item = t.type({
    id: t.number,
    quantity: t.number
});

const Recipe = t.type({
    name: t.string,
    rank: t.number,
    trade: t.string,
    reagents: t.array(Item),
    crafts: Item
});
export type IRecipe = t.TypeOf<typeof Recipe>;

const MaybeRecipe = t.partial({
    recipe: Recipe
});

const RecipeUpdated = t.type({
    updated: DateFromISOString
});

const RecipeInfo = t.intersection([RecipeUpdated, MaybeRecipe]);

const RecipeInfos = t.dictionary(t.refinement(t.string, key => /^\d+$/.test(key)), RecipeInfo);
type IRecipeInfos = t.TypeOf<typeof RecipeInfos>;

export class Recipes {
    private readonly file = "recipes.json";
    private recipes: IRecipeInfos = this.loadFromFile();

    private loadFromFile(): IRecipeInfos {
        try {
            return decodeOrThrow(RecipeInfos, JSON.parse(readFileSync(this.file).toString()));
        } catch (error) {
            console.debug("Recipes#loadFromFile", error, new Date());
        }
        return {};
    }

    async update() {
        try {
            const ids = await getRecipesIds();
            const never = new Date(0);
            for (const id of ids) {
                if (!this.recipes[id]) {
                    this.recipes[id] = { updated: never };
                }
            }
        } catch (error) {
            console.debug("Recipes#update", error, new Date());
        }
        await this.updateRecipes();
    }

    private async updateRecipes() {
        const now = new Date();
        for (const key in this.recipes) {
            try {
                const recipe = await getRecipe(parseInt(key));
                const value = this.recipes[key];
                value.recipe = recipe;
                value.updated = now;
            } catch (error) {
                if (!(error + "").includes("Invalid value \"REUSE ME")) {
                    console.debug("Recipes#updateRecipes " + key, error, new Date());
                }
            }
        }
        writeFileSync(this.file, JSON.stringify(this.recipes));
    }

    empty(): boolean {
        return Object.keys(this.recipes).length === 0;
    }

    items(): Set<number> {
        const items = new Set<number>();

        for (const key in this.recipes) {
            const recipe = this.recipes[key].recipe;
            if (recipe) {
                if (recipe.crafts.id !== 0) {
                    // Items with direct effects has zero id eg: Feathery Spellthread (279184)
                    items.add(recipe.crafts.id);
                }
                for (const i of recipe.reagents) {
                    items.add(i.id);
                }
            }
        }
        return items;
    }
}
