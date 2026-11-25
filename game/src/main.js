// Ember & Thyme — the game itself.
// Owns the state machine (title → playing → day done → game over), the day
// timer, and what happens when the chef works a station. Rendering lives in
// render.js, the rules of each station in cooking.js, tickets in orders.js.

import { DAYS, INGREDIENTS, PALETTE, TUNING, VIEW } from './config.js';
import { Chef } from './chef.js';
import { ChoppingBoard, PlatingCounter, Wok } from './cooking.js';
import { OrderBoard } from './orders.js';
import { Particles } from './particles.js';
import { Renderer } from './render.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { crateAt, isInReach, stationAt, STATIONS } from './kitchen.js';
import { stageShot } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new Renderer();
    this.sfx = new Sfx();
    this.chef = new Chef();
    this.board = new OrderBoard();
    this.choppingBoard = new ChoppingBoard();
    this.wok = new Wok();
    this.plating = new PlatingCounter();
    this.particles = new Particles();
    this.input = new Input(canvas, this);

    this.phase = 'title'; // title | playing | daydone | gameover
    this.dayIndex = 0;
    this.secondsLeft = DAYS[0].seconds;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.totalServed = 0;
    this.totalExpired = 0;
    this.bestScore = 0;
    this.bestCoins = 0;
    this.dayStats = { served: 0, expired: 0, earned: 0 };
    this.toast = null;
    this.hoverStation = null;
    this.pendingGrab = null; // ingredient to grab once the chef reaches the pantry
    this.frozen = false; // staged screenshots freeze the simulation
    this.lastMs = 0;
    this.elapsedMs = 0;

    const params = new URLSearchParams(window.location.search);
    this.shot = params.get('shot');
  }

  start() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (this.shot) {
      stageShot(this, this.shot);
      this.frozen = true;
    }
    requestAnimationFrame((ms) => this.loop(ms));
  }

  resize() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    this.canvas.width = VIEW.width;
    this.canvas.height = VIEW.height;
    this.canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
    this.canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  }

  // ------------------------------------------------------------ day flow

  startDay(dayIndex) {
    this.dayIndex = dayIndex;
    this.secondsLeft = DAYS[dayIndex].seconds;
    this.board.startDay(dayIndex);
    this.choppingBoard = new ChoppingBoard();
    this.wok = new Wok();
    this.plating = new PlatingCounter();
    this.chef.reset(640, 560);
    this.dayStats = { served: 0, expired: 0, earned: 0 };
    this.phase = 'playing';
    this.sfx.dayStart();
    this.showToast(`Day ${dayIndex + 1} — the night market opens!`, PALETTE.gold);
  }

  startGame() {
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.totalServed = 0;
    this.totalExpired = 0;
    this.sfx.unlock();
    this.startDay(0);
  }

  endDay() {
    this.sfx.stopSizzle();
    if (this.dayIndex >= DAYS.length - 1) {
      this.phase = 'gameover';
      this.bestScore = Math.max(this.bestScore, this.score);
      this.bestCoins = Math.max(this.bestCoins, this.coins);
    } else {
      this.phase = 'daydone';
    }
  }

  // ------------------------------------------------------------ interaction

  showToast(message, color = PALETTE.cream) {
    this.toast = { message, color, lifeMs: 2200 };
  }

  onKey(key) {
    if (key === 'm') {
      this.sfx.unlock();
      const muted = this.sfx.toggleMute();
      this.showToast(muted ? 'Sound off' : 'Sound on');
      return;
    }
    if (this.phase === 'title' && (key === 'enter' || key === ' ')) return this.startGame();
    if (this.phase === 'daydone' && (key === 'enter' || key === ' ')) return this.startDay(this.dayIndex + 1);
    if (this.phase === 'gameover' && (key === 'enter' || key === ' ' || key === 'r')) return this.startGame();
    if (this.phase !== 'playing') return;
    if (key === 'e' || key === ' ') {
      const near = Object.values(STATIONS).find((s) => isInReach(this.chef.x, this.chef.y, s));
      if (near) this.workStation(near);
    }
  }

  onHover(x, y) {
    const station = stationAt(x, y);
    this.hoverStation = station ? station.id : null;
  }

  onClick(x, y) {
    this.sfx.unlock();
    if (this.phase === 'title') return this.startGame();
    if (this.phase === 'daydone') {
      if (this.dayIndex < DAYS.length - 1) return this.startDay(this.dayIndex + 1);
      return;
    }
    if (this.phase === 'gameover') return this.startGame();
    if (this.phase !== 'playing') return;

    // Mute button, top right of the header.
    if (x >= 1180 && x <= 1240 && y >= 8 && y <= 48) {
      const muted = this.sfx.toggleMute();
      this.showToast(muted ? 'Sound off' : 'Sound on');
      return;
    }

    const crate = crateAt(x, y);
    if (crate) return this.grabFromCrate(crate);

    const station = stationAt(x, y);
    if (station) return this.workStation(station);

    // Empty floor: walk there.
    this.chef.walkTo(x, y);
  }

  grabFromCrate(crate) {
    if (this.chef.carryingPlate) {
      this.showToast('Hands full — serve the plate first!', PALETTE.danger);
      this.sfx.error();
      return;
    }
    if (this.chef.handsFull) {
      this.showToast('Hands full — chop or wok something first!', PALETTE.danger);
      this.sfx.error();
      return;
    }
    const pantry = STATIONS.pantry;
    if (!isInReach(this.chef.x, this.chef.y, pantry)) {
      // Walk to the pantry, then grab on arrival.
      this.chef.queueStation(pantry);
      this.pendingGrab = crate.ingredient;
      return;
    }
    this.takeIngredient(crate.ingredient);
  }

  takeIngredient(id) {
    if (this.chef.takeIngredient(id)) {
      this.sfx.pickup();
      const ing = INGREDIENTS[id];
      this.showToast(`${ing.chopped ? 'Raw' : ''} ${ing.name} in hand — ${ing.chopped ? 'chop it first!' : 'straight to the wok!'}`);
    }
  }

  workStation(station) {
    if (!isInReach(this.chef.x, this.chef.y, station)) {
      this.chef.queueStation(station);
      return;
    }
    this.doStationAction(station);
  }

  doStationAction(station) {
    switch (station.id) {
      case 'pantry':
        this.showToast('Click a crate to grab an ingredient.');
        break;
      case 'board':
        this.workBoard();
        break;
      case 'wok':
        this.workWok();
        break;
      case 'plating':
        this.workPlating();
        break;
      case 'serving':
        this.workServing();
        break;
      case 'trash':
        this.workTrash();
        break;
    }
  }

  workBoard() {
    // Collect anything already chopped.
    const done = this.choppingBoard.collectChopped();
    let collected = 0;
    for (const id of done) {
      // Hands full: leave the chopped piece on the board, still chopped.
      if (this.chef.takeIngredient(id, true)) collected++;
      else this.choppingBoard.slots.push({ id, progress: 1 });
    }
    // Put raw choppable ingredients from the hands onto the board.
    let placed = 0;
    for (const item of [...this.chef.carryingIngredients]) {
      if (!item.chopped && INGREDIENTS[item.id].chopped && this.choppingBoard.freeSlots > 0) {
        this.chef.dropIngredient(item.id);
        this.choppingBoard.place(item.id);
        placed++;
      }
    }
    if (placed > 0) {
      this.sfx.chop();
      this.showToast(`Chopping ${placed} ingredient${placed > 1 ? 's' : ''}…`);
    } else if (collected > 0) {
      this.showToast(`Picked up ${collected} chopped ingredient${collected > 1 ? 's' : ''}.`);
    } else if (this.choppingBoard.chopping) {
      this.showToast('Still chopping…');
    } else {
      this.showToast('Nothing to chop — grab a raw ingredient first.', PALETTE.danger);
      this.sfx.error();
    }
  }

  workWok() {
    if (this.wok.burnt) {
      this.showToast('Burnt! Dump it in the compost bin.', PALETTE.danger);
      this.sfx.error();
      return;
    }
    if (this.wok.done && this.wok.dish) {
      if (this.plating.freeSlots > 0) {
        const dish = this.wok.takeDish();
        this.plating.place(dish);
        this.particles.sparkle(732, 250);
        this.sfx.ding();
        this.showToast(`${dish.name} plated — pick it up and serve!`, PALETTE.gold);
      } else {
        this.showToast('Plating counter is full!', PALETTE.danger);
        this.sfx.error();
      }
      return;
    }
    // Add carried ingredients to the wok.
    let added = 0;
    let needChop = null;
    for (const item of [...this.chef.carryingIngredients]) {
      if (INGREDIENTS[item.id].chopped && !item.chopped) { needChop = item.id; continue; }
      if (this.wok.isFull) break;
      if (this.wok.add(item.id)) {
        this.chef.dropIngredient(item.id);
        added++;
      }
    }
    if (added > 0) {
      this.sfx.wokAdd();
      this.particles.steam(732, 230);
      this.showToast(`Into the wok — ${this.wok.contents.length}/${TUNING.wokSlots} in, cooking…`);
    } else if (needChop) {
      this.showToast(`${INGREDIENTS[needChop].name} needs chopping first!`, PALETTE.danger);
      this.sfx.error();
    } else if (this.wok.isFull) {
      this.showToast('The wok is full — let it cook.', PALETTE.danger);
    } else {
      this.showToast('Hands empty — grab ingredients first.', PALETTE.danger);
      this.sfx.error();
    }
  }

  workPlating() {
    if (this.plating.plates.length === 0) {
      this.showToast('No finished plate here yet.', PALETTE.danger);
      this.sfx.error();
      return;
    }
    if (this.chef.hands.length > 0) {
      this.showToast('Hands full — empty them first!', PALETTE.danger);
      this.sfx.error();
      return;
    }
    const dish = this.plating.takePlate();
    this.chef.takePlate(dish);
    this.sfx.pickup();
    this.showToast(`${dish.name} in hand — to the serving window!`, PALETTE.gold);
  }

  workServing() {
    const plate = this.chef.carryingPlate;
    if (!plate) {
      this.showToast('Bring a finished plate to serve.', PALETTE.danger);
      this.sfx.error();
      return;
    }
    const dish = plate.dish;
    this.chef.clearHands();
    this.sfx.bell();
    const ticket = this.board.findTicketForDish(dish.id);
    if (ticket) {
      const pay = this.board.serveTicket(ticket, this.combo);
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.coins += pay.coins;
      this.score += pay.coins + 25;
      this.totalServed++;
      this.dayStats.served++;
      this.dayStats.earned += pay.coins;
      this.sfx.coin();
      this.particles.sparkle(1032, 430);
      this.particles.floatText(`+${pay.coins}c`, 1032, 420, PALETTE.gold, 26);
      this.showToast(
        pay.golden
          ? `Golden ticket! ${dish.name} served — +${pay.coins}c (tip ${pay.tip}c) ×2!`
          : `${dish.name} served — +${pay.coins}c (tip ${pay.tip}c)${this.combo >= 2 ? ` · combo ×${this.combo}` : ''}`,
        PALETTE.gold,
      );
    } else if (dish.id === 'mystery-mush') {
      this.coins += dish.coins;
      this.score += dish.coins;
      this.dayStats.earned += dish.coins;
      this.sfx.coin();
      this.showToast(`Mystery Mush sold to a brave stranger — +${dish.coins}c.`, PALETTE.cream);
    } else {
      this.combo = 0;
      this.score = Math.max(0, this.score - TUNING.wrongServePenalty);
      this.sfx.expired();
      this.showToast(`Nobody ordered ${dish.name} — tossed, combo lost.`, PALETTE.danger);
    }
  }

  workTrash() {
    if (this.wok.burnt || !this.wok.isEmpty) {
      this.wok.dump();
      this.sfx.noise(200, 0.08, 500);
      this.showToast('Wok emptied into the compost.');
      return;
    }
    if (this.chef.hands.length > 0) {
      this.chef.clearHands();
      this.showToast('Hands emptied into the compost.');
      return;
    }
    this.showToast('Nothing to throw away.');
  }

  // ------------------------------------------------------------ simulation

  update(dtMs) {
    this.elapsedMs += dtMs;
    if (this.phase !== 'playing') return;

    this.chef.update(dtMs, this.input.keys);

    // Arrived at a queued station: work it (and grab a queued crate).
    if (this.chef.queuedStation && !this.chef.target) {
      const station = this.chef.queuedStation;
      this.chef.queuedStation = null;
      if (this.pendingGrab && station.id === 'pantry') {
        const id = this.pendingGrab;
        this.pendingGrab = null;
        this.takeIngredient(id);
      } else {
        this.doStationAction(station);
      }
    }

    // Day clock.
    this.secondsLeft -= dtMs / 1000;
    if (this.secondsLeft <= 0) {
      this.secondsLeft = 0;
      this.endDay();
      return;
    }

    // Tickets.
    const expired = this.board.update(dtMs, this.elapsedMs, this.secondsLeft);
    for (const ticket of expired) {
      this.combo = 0;
      this.score = Math.max(0, this.score - TUNING.expiredTicketPenalty);
      this.totalExpired++;
      this.dayStats.expired++;
      this.sfx.expired();
      this.showToast(`${ticket.recipe.name} walked out — patience gone!`, PALETTE.danger);
    }

    // Chopping finishes: auto-collect into free hands.
    const finished = this.choppingBoard.update(dtMs);
    if (finished.length > 0) {
      for (const id of finished) {
        const slot = this.choppingBoard.slots.find((s) => s.id === id && s.progress >= 1);
        if (!slot) continue;
        this.choppingBoard.slots.splice(this.choppingBoard.slots.indexOf(slot), 1);
        if (!this.chef.takeIngredient(id, true)) {
          this.choppingBoard.slots.push({ id, progress: 1 }); // hands full: leave it on the board
        } else {
          this.particles.chopBits(456, 240, INGREDIENTS[id].color);
        }
      }
      this.sfx.chop();
    }

    // Wok cooking / burning.
    const justDone = this.wok.update(dtMs);
    if (justDone) {
      this.sfx.ding();
      this.particles.sparkle(732, 230);
      this.showToast(`${justDone.name} is ready — plate it before it burns!`, PALETTE.gold);
    }
    if (this.wok.burnt && !this.wok._burnToastShown) {
      this.wok._burnToastShown = true;
      this.showToast('The wok burned! Compost it.', PALETTE.danger);
      this.sfx.expired();
    }
    if (!this.wok.burnt) this.wok._burnToastShown = false;

    // Sizzle while something cooks; steam and embers for atmosphere.
    if (!this.wok.isEmpty && !this.wok.done) this.sfx.startSizzle();
    else this.sfx.stopSizzle();
    if (Math.random() < dtMs / 240) this.particles.steam(732, 225);
    if (!this.wok.isEmpty && Math.random() < dtMs / 500) this.particles.ember(732, 275);

    this.particles.update(dtMs);
    if (this.toast) {
      this.toast.lifeMs -= dtMs;
      if (this.toast.lifeMs <= 0) this.toast = null;
    }
  }

  loop(ms) {
    const dtMs = this.lastMs ? Math.min(100, ms - this.lastMs) : 16;
    this.lastMs = ms;
    if (!this.frozen) this.update(dtMs);
    // Frozen (staged screenshot): nothing ages — steam, embers and the
    // floating "+24c" stay exactly as the scene composed them.
    this.renderer.draw(this.ctx, this, ms);
    requestAnimationFrame((next) => this.loop(next));
  }

  // Snapshot the autopilot and tests read.
  debugState() {
    return {
      phase: this.phase,
      day: this.dayIndex + 1,
      secondsLeft: Math.round(this.secondsLeft),
      score: this.score,
      coins: this.coins,
      combo: this.combo,
      served: this.totalServed,
      expired: this.totalExpired,
      tickets: this.board.tickets.map((t) => t.recipe.id),
      hands: this.chef.hands.map((h) => (h.kind === 'plate' ? `plate:${h.dish.id}` : `${h.id}${h.chopped ? ':chopped' : ''}`)),
      boardSlots: this.choppingBoard.slots.map((s) => `${s.id}:${Math.round(s.progress * 100)}%`),
      wok: { contents: [...this.wok.contents], progress: Math.round(this.wok.cookProgress * 100), done: this.wok.done, burnt: this.wok.burnt, dish: this.wok.dish?.id ?? null },
      plates: this.plating.plates.map((d) => d.id),
    };
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__emberGame = game;
game.start();
