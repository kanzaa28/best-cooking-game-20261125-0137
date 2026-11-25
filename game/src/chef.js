// Ember & Thyme — the chef.
// The chef walks the floor on WASD / arrows or toward a clicked point, and
// carries up to three things in their hands (raw or chopped ingredients, or
// one finished plate). Movement is purely visual: the chef's job is to be
// standing at the right station at the right moment.

import { TUNING, VIEW } from './config.js';

export class Chef {
  constructor() {
    this.x = 640;
    this.y = 560;
    this.target = null; // {x, y} walk destination, or null when idle
    this.facing = 1; // 1 = right, -1 = left
    this.moving = false;
    this.walkPhase = 0; // drives the little bob while walking
    this.hands = []; // entries: { kind: 'ingredient'|'plate', id, chopped?, dish? }
    this.queuedStation = null; // station to work once the chef arrives
  }

  get handsFull() {
    return this.hands.length >= TUNING.chefCarryMax;
  }

  get carryingPlate() {
    return this.hands.find((h) => h.kind === 'plate') ?? null;
  }

  get carryingIngredients() {
    return this.hands.filter((h) => h.kind === 'ingredient');
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.target = null;
    this.queuedStation = null;
    this.hands = [];
    this.moving = false;
  }

  walkTo(x, y) {
    this.target = {
      x: Math.max(30, Math.min(VIEW.width - 30, x)),
      y: Math.max(340, Math.min(VIEW.height - 24, y)),
    };
  }

  queueStation(station) {
    this.queuedStation = station;
    this.walkTo(station.approach.x, station.approach.y);
  }

  takeIngredient(id, chopped = false) {
    if (this.handsFull || this.carryingPlate) return false;
    this.hands.push({ kind: 'ingredient', id, chopped });
    return true;
  }

  takePlate(dish) {
    if (this.hands.length > 0) return false;
    this.hands.push({ kind: 'plate', dish });
    return true;
  }

  dropIngredient(id) {
    const i = this.hands.findIndex((h) => h.kind === 'ingredient' && h.id === id);
    if (i < 0) return null;
    return this.hands.splice(i, 1)[0];
  }

  clearHands() {
    const dropped = this.hands;
    this.hands = [];
    return dropped;
  }

  update(dtMs, keys) {
    const dt = dtMs / 1000;
    let dx = 0;
    let dy = 0;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      // Keyboard steering cancels any walk order.
      this.target = null;
      this.queuedStation = null;
      const len = Math.hypot(dx, dy);
      this.x += (dx / len) * TUNING.chefSpeedPxPerSec * dt;
      this.y += (dy / len) * TUNING.chefSpeedPxPerSec * dt;
      this.facing = dx !== 0 ? Math.sign(dx) : this.facing;
      this.moving = true;
    } else if (this.target) {
      const ddx = this.target.x - this.x;
      const ddy = this.target.y - this.y;
      const dist = Math.hypot(ddx, ddy);
      const step = TUNING.chefSpeedPxPerSec * dt;
      if (dist <= step) {
        this.x = this.target.x;
        this.y = this.target.y;
        this.target = null;
        this.moving = false;
      } else {
        this.x += (ddx / dist) * step;
        this.y += (ddy / dist) * step;
        this.facing = ddx !== 0 ? Math.sign(ddx) : this.facing;
        this.moving = true;
      }
    } else {
      this.moving = false;
    }

    this.x = Math.max(30, Math.min(VIEW.width - 30, this.x));
    this.y = Math.max(340, Math.min(VIEW.height - 24, this.y));
    if (this.moving) this.walkPhase += dtMs / 90;
  }
}
