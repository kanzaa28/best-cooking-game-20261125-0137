// Ember & Thyme — game configuration.
// Every tunable number, ingredient and recipe lives here so the rest of the
// game reads like a kitchen manual, not a bag of magic numbers.

export const VIEW = { width: 1280, height: 720 };

export const PALETTE = {
  night: '#191024',
  nightDeep: '#120b1c',
  floor: '#2b1d33',
  floorTile: '#33243d',
  wood: '#7a4a2b',
  woodDark: '#5d3620',
  woodLight: '#96603a',
  counterTop: '#c98d5a',
  brass: '#e8b45a',
  brassDark: '#b98a3a',
  cream: '#f7ead2',
  ink: '#241722',
  ember: '#ff7a2f',
  flame: '#ffb347',
  leaf: '#7fc96b',
  tomato: '#e4572e',
  gold: '#ffd166',
  danger: '#ff5a5a',
  ok: '#7fc96b',
};

// One ingredient: its name, its colours, whether it must be chopped before
// the wok, and the shape key render.js draws for it.
export const INGREDIENTS = {
  noodle:  { name: 'Noodle',   color: '#f2c94c', dark: '#d9a521', chopped: false, shape: 'noodle' },
  chicken: { name: 'Chicken',  color: '#f6d7a8', dark: '#d9a05b', chopped: true,  shape: 'drumstick' },
  prawn:   { name: 'Prawn',    color: '#ff9d76', dark: '#e56b4a', chopped: true,  shape: 'prawn' },
  pepper:  { name: 'Pepper',   color: '#e4572e', dark: '#b23a1d', chopped: true,  shape: 'pepper' },
  mushroom:{ name: 'Mushroom', color: '#e8dcc8', dark: '#b8a888', chopped: true,  shape: 'mushroom' },
  egg:     { name: 'Egg',      color: '#fff3c4', dark: '#e8c96a', chopped: false, shape: 'egg' },
  chili:   { name: 'Chili',    color: '#d7263d', dark: '#9c1b2e', chopped: false, shape: 'chili' },
  herb:    { name: 'Herb',     color: '#7fc96b', dark: '#4d8f3f', chopped: false, shape: 'herb' },
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS);

// A recipe is a dish: the exact set of ingredients the wok must hold.
// Order of ingredients does not matter; a wok that finishes with any other
// set becomes Mystery Mush, worth a few coins and matching no ticket.
export const RECIPES = [
  { id: 'ember-noodles',    name: 'Ember Noodles',     needs: ['noodle', 'chicken', 'chili'],    coins: 18, color: '#ff7a2f' },
  { id: 'prawn-sizzle',     name: 'Prawn Sizzle',      needs: ['prawn', 'pepper', 'herb'],       coins: 20, color: '#ff9d76' },
  { id: 'golden-omelette',  name: 'Golden Omelette',   needs: ['egg', 'mushroom', 'herb'],       coins: 16, color: '#ffd166' },
  { id: 'market-fried-rice',name: 'Market Fried Rice', needs: ['egg', 'chicken', 'pepper'],      coins: 18, color: '#f2c94c' },
  { id: 'spicy-mushroom',   name: 'Spicy Mushroom Wok',needs: ['mushroom', 'chili', 'noodle'],   coins: 17, color: '#c96b7f' },
  { id: 'garden-prawn',     name: 'Garden Prawn Wok',  needs: ['prawn', 'pepper', 'mushroom'],    coins: 21, color: '#7fc96b' },
];

export function findRecipe(ingredientIds) {
  const sorted = [...ingredientIds].sort().join(',');
  return RECIPES.find((r) => [...r.needs].sort().join(',') === sorted) ?? null;
}

// One day of service: how long it lasts, how fast tickets arrive, how long
// a customer waits, and how many tickets may hang on the board at once.
export const DAYS = [
  { day: 1, seconds: 150, spawnEveryMs: 14000, patienceMs: 52000, maxTickets: 3, rushAtSecondsLeft: 30 },
  { day: 2, seconds: 150, spawnEveryMs: 11000, patienceMs: 46000, maxTickets: 4, rushAtSecondsLeft: 35 },
  { day: 3, seconds: 180, spawnEveryMs: 9000,  patienceMs: 40000, maxTickets: 4, rushAtSecondsLeft: 40 },
];

export const TUNING = {
  chefSpeedPxPerSec: 300,
  chefCarryMax: 3,
  chopMsPerItem: 1400,
  boardSlots: 2,
  wokSlots: 3,
  wokCookMs: 4200,
  wokBurnMsAfterDone: 6000,
  plateSlots: 2,
  servePatienceBonusMax: 10,
  comboStep: 0.1,
  comboCap: 2.0,
  mysteryMushCoins: 5,
  wrongServePenalty: 5,
  expiredTicketPenalty: 5,
  rushSpawnMultiplier: 0.55,
  rushCoinMultiplier: 2,
};
