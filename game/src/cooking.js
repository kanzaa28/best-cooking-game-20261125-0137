// Ember & Thyme — the three cooking stations.
// ChoppingBoard turns raw ingredients into chopped ones on a timer.
// Wok cooks whatever is inside it and names the dish when the set matches
// a recipe — or burns it if the chef walks away too long.
// PlatingCounter holds finished plates until the chef picks one up.

import { INGREDIENTS, TUNING, findRecipe } from './config.js';

// One thing sitting on the board: what it is, and how chopped it is (0..1).
export class ChoppingBoard {
  constructor() {
    this.slots = []; // { id, progress }
  }

  get freeSlots() {
    return TUNING.boardSlots - this.slots.length;
  }

  // Only ingredients that need chopping go on the board; the rest skip it.
  accepts(ingredientId) {
    return INGREDIENTS[ingredientId].chopped && this.freeSlots > 0;
  }

  place(ingredientId) {
    if (!this.accepts(ingredientId)) return false;
    this.slots.push({ id: ingredientId, progress: 0 });
    return true;
  }

  update(dtMs) {
    const finished = [];
    for (const slot of this.slots) {
      if (slot.progress < 1) {
        slot.progress = Math.min(1, slot.progress + dtMs / TUNING.chopMsPerItem);
        if (slot.progress >= 1) finished.push(slot.id);
      }
    }
    return finished; // ingredient ids that just finished chopping
  }

  collectChopped() {
    const done = this.slots.filter((s) => s.progress >= 1).map((s) => s.id);
    this.slots = this.slots.filter((s) => s.progress < 1);
    return done;
  }

  get chopping() {
    return this.slots.some((s) => s.progress < 1);
  }

  get choppedWaiting() {
    return this.slots.filter((s) => s.progress >= 1).length;
  }
}

export class Wok {
  constructor() {
    this.contents = []; // ingredient ids, in the order they went in
    this.cookProgress = 0; // 0..1 while cooking
    this.done = false;
    this.burnt = false;
    this.burnTimerMs = 0;
    this.dish = null; // recipe (or mystery mush) once cooked
  }

  get isEmpty() {
    return this.contents.length === 0;
  }

  get isFull() {
    return this.contents.length >= TUNING.wokSlots;
  }

  add(ingredientId) {
    if (this.isFull || this.done || this.burnt) return false;
    this.contents.push(ingredientId);
    return true;
  }

  update(dtMs) {
    if (this.isEmpty || this.done) {
      if (this.done && !this.burnt) {
        this.burnTimerMs += dtMs;
        if (this.burnTimerMs >= TUNING.wokBurnMsAfterDone) {
          this.burnt = true;
          this.dish = null;
        }
      }
      return null;
    }
    this.cookProgress += dtMs / TUNING.wokCookMs;
    if (this.cookProgress >= 1) {
      this.cookProgress = 1;
      this.done = true;
      const recipe = findRecipe(this.contents);
      this.dish = recipe ?? { id: 'mystery-mush', name: 'Mystery Mush', needs: [...this.contents], coins: TUNING.mysteryMushCoins, color: '#8a7f8f' };
      return this.dish;
    }
    return null;
  }

  // Take the finished dish out of the wok, leaving the wok empty.
  takeDish() {
    if (!this.done || this.burnt || !this.dish) return null;
    const dish = this.dish;
    this.contents = [];
    this.cookProgress = 0;
    this.done = false;
    this.burnTimerMs = 0;
    this.dish = null;
    return dish;
  }

  dump() {
    const had = this.contents.length > 0 || this.done;
    this.contents = [];
    this.cookProgress = 0;
    this.done = false;
    this.burnt = false;
    this.burnTimerMs = 0;
    this.dish = null;
    return had;
  }
}

export class PlatingCounter {
  constructor() {
    this.plates = []; // dishes waiting to be picked up
  }

  get freeSlots() {
    return TUNING.plateSlots - this.plates.length;
  }

  place(dish) {
    if (this.freeSlots <= 0) return false;
    this.plates.push(dish);
    return true;
  }

  takePlate() {
    return this.plates.shift() ?? null;
  }
}
