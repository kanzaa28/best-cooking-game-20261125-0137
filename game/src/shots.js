// Ember & Thyme — staged scenes and the autopilot.
// ?shot=cover|assembly|serve|rush freezes the game in a composed moment so
// screenshots show the kitchen at its best. The autopilot plays the real
// game through the same clicks a player makes: it is the playtest, not a
// shortcut around the rules.

import { INGREDIENTS, RECIPES, TUNING } from './config.js';
import { PANTRY_CRATES, STATIONS, stationCenter } from './kitchen.js';

function ticketFor(game, recipeId, patienceRatio = 0.8, golden = false) {
  const ticket = game.board.spawnTicket(game.elapsedMs);
  if (!ticket) return null;
  ticket.recipe = RECIPES.find((r) => r.id === recipeId);
  ticket.patienceLeftMs = ticket.patienceMs * patienceRatio;
  ticket.golden = golden;
  return ticket;
}

function setChef(game, x, y, hands = []) {
  game.chef.x = x;
  game.chef.y = y;
  game.chef.target = null;
  game.chef.queuedStation = null;
  game.chef.hands = hands;
}

// Compose one frozen moment. The caller freezes the simulation afterwards,
// so nothing here needs to survive an update tick.
export function stageShot(game, name) {
  game.startGame();
  game.sfx.muted = true; // screenshots are silent
  const wokAt = stationCenter(STATIONS.wok);
  const boardAt = stationCenter(STATIONS.board);

  if (name === 'cover') {
    // The whole game in one frame: order board, pantry, a dish mid-chop,
    // the wok cooking, a plate ready, the timer running.
    game.secondsLeft = 118;
    game.score = 210;
    game.coins = 84;
    game.combo = 3;
    ticketFor(game, 'ember-noodles', 0.75);
    ticketFor(game, 'prawn-sizzle', 0.55);
    ticketFor(game, 'golden-omelette', 0.9);
    setChef(game, 700, 420, [
      { kind: 'ingredient', id: 'chili', chopped: false },
    ]);
    game.choppingBoard.slots = [
      { id: 'chicken', progress: 0.6 },
      { id: 'pepper', progress: 1 },
    ];
    game.wok.contents = ['noodle', 'chicken'];
    game.wok.cookProgress = 0.55;
    game.plating.place(RECIPES.find((r) => r.id === 'market-fried-rice'));
    game.particles.steam(wokAt.x, wokAt.y - 10);
    game.particles.steam(wokAt.x + 20, wokAt.y - 14);
    game.particles.ember(wokAt.x, wokAt.y + 20);
    game.showToast('Ember Noodles on the board — chop, wok, serve!');
  } else if (name === 'assembly') {
    // Mid-assembly: the knife is down, the wok is already sizzling.
    game.secondsLeft = 132;
    game.score = 96;
    game.coins = 32;
    game.combo = 1;
    ticketFor(game, 'prawn-sizzle', 0.6);
    ticketFor(game, 'spicy-mushroom', 0.85);
    setChef(game, boardAt.x, 400, [{ kind: 'ingredient', id: 'noodle', chopped: false }]);
    game.choppingBoard.slots = [
      { id: 'prawn', progress: 0.55 },
      { id: 'pepper', progress: 1 },
    ];
    game.wok.contents = ['mushroom'];
    game.wok.cookProgress = 0.3;
    game.particles.chopBits(boardAt.x, boardAt.y + 10, INGREDIENTS.prawn.color);
    game.particles.steam(wokAt.x, wokAt.y - 10);
    game.showToast('Chopping… the prawn goes in next!');
  } else if (name === 'serve') {
    // The serve: plate in hand at the window, the ticket waiting, coins flying.
    game.secondsLeft = 96;
    game.score = 340;
    game.coins = 126;
    game.combo = 4;
    ticketFor(game, 'golden-omelette', 0.4, true);
    ticketFor(game, 'ember-noodles', 0.7);
    setChef(game, 1032, 600, [
      { kind: 'plate', dish: RECIPES.find((r) => r.id === 'golden-omelette') },
    ]);
    game.particles.sparkle(1032, 430);
    game.particles.floatText('+24c', 1032, 420, '#ffd166', 26);
    game.showToast('Golden Omelette served — +24c (tip 6c) · combo ×4', '#ffd166');
  } else if (name === 'rush') {
    // Rush hour: four tickets, two nearly out of patience, the wok done.
    game.secondsLeft = 24;
    game.score = 480;
    game.coins = 210;
    game.combo = 5;
    game.board.rush = true;
    game.board.dayConfig = { ...game.board.dayConfig, maxTickets: 4 }; // rush board holds four tickets
    ticketFor(game, 'prawn-sizzle', 0.22, true);
    ticketFor(game, 'ember-noodles', 0.3, true);
    ticketFor(game, 'garden-prawn', 0.5);
    ticketFor(game, 'market-fried-rice', 0.65);
    setChef(game, 760, 430, [{ kind: 'ingredient', id: 'herb', chopped: false }]);
    game.choppingBoard.slots = [{ id: 'mushroom', progress: 0.8 }];
    game.wok.contents = ['prawn', 'pepper', 'herb'];
    game.wok.cookProgress = 1;
    game.wok.done = true;
    game.wok.dish = RECIPES.find((r) => r.id === 'prawn-sizzle');
    game.particles.steam(wokAt.x, wokAt.y - 10);
    game.particles.sparkle(wokAt.x, wokAt.y - 20);
    game.showToast('RUSH HOUR — plate it before it burns!', '#ff7a2f');
  }
}

// --------------------------------------------------------------- autopilot

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, label, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = check();
    if (ok) return ok;
    await sleep(120);
  }
  throw new Error(`autopilot timeout waiting for: ${label}`);
}

function clickAt(game, x, y) {
  game.onClick(x, y);
}

function clickStation(game, id) {
  const c = stationCenter(STATIONS[id]);
  clickAt(game, c.x, c.y);
}

function clickCrate(game, ingredientId) {
  const crate = PANTRY_CRATES.find((c) => c.ingredient === ingredientId);
  clickAt(game, crate.x + crate.w / 2, crate.y + crate.h / 2);
}

// Play the real game, through real clicks, until one full order is served.
// Returns the served dish id. Throws on timeout so the test fails loudly.
export async function autopilotServeOneOrder(game) {
  if (game.phase === 'title') game.startGame();
  await waitFor(() => game.phase === 'playing', 'playing phase');
  await waitFor(() => game.board.tickets.length > 0, 'first ticket');
  const ticket = game.board.tickets[0];
  const recipe = ticket.recipe;
  const servedBefore = game.totalServed;

  for (const ingredientId of recipe.needs) {
    const needsChop = INGREDIENTS[ingredientId].chopped;
    clickCrate(game, ingredientId);
    await waitFor(
      () => game.chef.hands.some((h) => h.id === ingredientId) || game.choppingBoard.slots.some((s) => s.id === ingredientId),
      `grab ${ingredientId}`,
    );
    if (needsChop) {
      clickStation(game, 'board');
      await waitFor(
        () => game.chef.hands.some((h) => h.id === ingredientId && h.chopped),
        `chopped ${ingredientId}`,
      );
    }
  }

  clickStation(game, 'wok');
  await waitFor(() => game.wok.done, 'wok done', 20000);
  if (game.wok.dish?.id !== recipe.id) {
    throw new Error(`wok produced ${game.wok.dish?.id}, expected ${recipe.id}`);
  }
  clickStation(game, 'wok');
  await waitFor(() => game.plating.plates.length > 0, 'dish plated');
  clickStation(game, 'plating');
  await waitFor(() => game.chef.carryingPlate, 'plate in hand');
  clickStation(game, 'serving');
  await waitFor(() => game.totalServed > servedBefore, 'order served', 20000);
  return recipe.id;
}

window.__emberAutopilot = autopilotServeOneOrder;
