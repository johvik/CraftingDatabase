import * as t from "io-ts";
import { readFileSync, writeFileSync } from "fs";
import { DateFromISOString } from "io-ts-types/lib/Date/DateFromISOString";
import { getRecipesIds, getRecipe } from "./wowdb";

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

const RecipeInfos = t.dictionary(t.number, RecipeInfo);
type IRecipeInfos = t.TypeOf<typeof RecipeInfos>;

export class Recipes {
    readonly file = "recipes.json";
    recipes: IRecipeInfos = this.loadFromFile();

    private loadFromFile(): IRecipeInfos {
        try {
            const result = RecipeInfos.decode(JSON.parse(readFileSync(this.file).toString()));
            if (result.isRight()) {
                return result.value;
            }
        } catch (e) {
            console.error("Recipes#loadFromFile", e);
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
        } catch (e) {
            console.error("Recipes#update", e);
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
            } catch (e) {
                console.error("Recipes#updateRecipes", e);
            }
        }
        writeFileSync(this.file, JSON.stringify(this.recipes));
    }
}
