// Ember & Thyme — the order board.
// Tickets arrive on a timer, each naming one dish and a patience bar that
// drains in real time. Serve the matching dish before the bar empties and
// the customer pays, tipped by how much patience is left; let it run out
// and the ticket storms off, breaking the combo.

import { DAYS, RECIPES, TUNING } from './config.js';

let nextTicketId = 1;

export class OrderBoard {
  constructor() {
    this.tickets = [];
    this.spawnTimerMs = 0;
    this.servedCount = 0;
    this.expiredCount = 0;
    this.dayConfig = DAYS[0];
    this.rush = false;
  }

  startDay(dayIndex) {
    this.dayConfig = DAYS[dayIndex];
    this.tickets = [];
    this.spawnTimerMs = 2500; // first ticket arrives quickly, the board is never empty
    this.rush = false;
  }

  // Pick a dish the board does not already ask for, so every ticket is a
  // different cooking job and the player plans, not repeats.
  pickDish() {
    const wanted = new Set(this.tickets.map((t) => t.recipe.id));
    const pool = RECIPES.filter((r) => !wanted.has(r.id));
    const list = pool.length > 0 ? pool : RECIPES;
    return list[Math.floor(Math.random() * list.length)];
  }

  spawnTicket(nowMs) {
    if (this.tickets.length >= this.dayConfig.maxTickets) return null;
    const recipe = this.pickDish();
    const ticket = {
      id: nextTicketId++,
      recipe,
      bornMs: nowMs,
      patienceMs: this.dayConfig.patienceMs,
      patienceLeftMs: this.dayConfig.patienceMs,
      golden: this.rush, // rush-hour tickets pay double
    };
    this.tickets.push(ticket);
    return ticket;
  }

  update(dtMs, nowMs, secondsLeft) {
    const wasRush = this.rush;
    this.rush = secondsLeft <= this.dayConfig.rushAtSecondsLeft;
    if (this.rush && !wasRush) this.spawnTimerMs = Math.min(this.spawnTimerMs, 1200);

    const interval = this.dayConfig.spawnEveryMs * (this.rush ? TUNING.rushSpawnMultiplier : 1);
    this.spawnTimerMs -= dtMs;
    if (this.spawnTimerMs <= 0) {
      this.spawnTicket(nowMs);
      this.spawnTimerMs = interval;
    }

    const expired = [];
    for (const ticket of this.tickets) {
      ticket.patienceLeftMs -= dtMs;
      if (ticket.patienceLeftMs <= 0) expired.push(ticket);
    }
    for (const ticket of expired) {
      this.tickets.splice(this.tickets.indexOf(ticket), 1);
      this.expiredCount++;
    }
    return expired;
  }

  findTicketForDish(dishId) {
    return this.tickets.find((t) => t.recipe.id === dishId) ?? null;
  }

  // Serving a ticket pays its coins, plus a tip for fast service, times the
  // combo multiplier (and doubled on a golden rush ticket).
  serveTicket(ticket, combo) {
    this.tickets.splice(this.tickets.indexOf(ticket), 1);
    this.servedCount++;
    const patienceRatio = Math.max(0, ticket.patienceLeftMs / ticket.patienceMs);
    const tip = Math.round(patienceRatio * TUNING.servePatienceBonusMax);
    const multiplier = Math.min(TUNING.comboCap, 1 + combo * TUNING.comboStep) *
      (ticket.golden ? TUNING.rushCoinMultiplier : 1);
    const coins = Math.max(1, Math.round((ticket.recipe.coins + tip) * multiplier));
    return { coins, tip, golden: ticket.golden };
  }

  patienceRatio(ticket) {
    return Math.max(0, ticket.patienceLeftMs / ticket.patienceMs);
  }
}
