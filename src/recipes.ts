import * as t from "io-ts";
import { readFileSync, writeFileSync } from "fs";
import { DateFromISOString } from "io-ts-types/lib/Date/DateFromISOString";
import { getRecipesIds, getRecipe } from "./wowdb";
import { decodeOrThrow } from "./utils";

const Item = t.type({
    id: t.number,
    quantity: t.number
});

const Recipe = t.type({
    id: t.number,
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
    readonly file = "recipes.json";
    recipes: IRecipeInfos = this.loadFromFile();

    private loadFromFile(): IRecipeInfos {
        try {
            return decodeOrThrow(RecipeInfos, JSON.parse(readFileSync(this.file).toString()));
        } catch (error) {
            console.debug("Recipes#loadFromFile", error);
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
            console.debug("Recipes#update", error);
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
                console.debug("Recipes#updateRecipes", error);
            }
        }
        writeFileSync(this.file, JSON.stringify(this.recipes));
    }
}
