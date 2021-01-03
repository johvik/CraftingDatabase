import * as t from 'io-ts';
import { decodeOrThrow, fetchWithTimeout } from '../utils';

const Reagent = t.type({
  Item: t.number,
  ItemQty: t.number,
});

const Effect = t.type({
  Item: t.number,
  BasePoints: t.number,
});

const Spell = t.type({
  ID: t.number,
  Icon: t.string,
  Rank: t.string,
  Reagents: t.refinement(t.array(Reagent), (reagents) => reagents.length !== 0),
  Name: t.refinement(t.string, (name) => !name.startsWith('REUSE ME')),
  Effects: t.refinement(t.array(Effect), (effects) => effects.length >= 1),
});

export default async function getRecipe(spellId: number) {
  const url = `https://www.wowdb.com/api/spell/${spellId}`;
  const res = await fetchWithTimeout(url, 5000);
  // Remove the extra parentheses in the body
  const spell = decodeOrThrow(Spell, JSON.parse(res.text.slice(1, -1)));
  const rankMatch = spell.Rank.match(/.* (\d+)/);
  if (spell.ID !== spellId) {
    throw new Error(`Wrong ID ${spellId}`);
  }
  const rank = rankMatch ? parseInt(rankMatch[1], 10) : 0;
  const trade = spell.Icon;
  const reagents = spell.Reagents.map(
    (reagent) => ({ id: reagent.Item, quantity: reagent.ItemQty }),
  );
  const effect = spell.Effects[0];
  if (effect.Item === 0) {
    throw new Error(`Effect item ID is zero ${spellId}`);
  }
  const quantity = Math.max(1, effect.BasePoints);

  return {
    name: spell.Name,
    rank,
    trade,
    reagents,
    crafts: {
      id: effect.Item,
      quantity,
    },
  };
}
