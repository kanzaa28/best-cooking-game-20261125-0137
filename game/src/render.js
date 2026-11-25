// Ember & Thyme — everything the player sees.
// One canvas, drawn in layers: the night-market room, the order rail, the
// stations with their food, the chef, the particles, then the HUD and any
// overlay screen. Every ingredient and dish is drawn from vector shapes —
// no image files are shipped, so nothing can fail to load.

import { INGREDIENTS, PALETTE, VIEW } from './config.js';
import { PANTRY_CRATES, STATIONS } from './kitchen.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', bold = false, font = 'Georgia, serif') {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ---------------------------------------------------------------- food art

export function drawIngredientIcon(ctx, id, x, y, size, chopped = false) {
  const ing = INGREDIENTS[id];
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (chopped) {
    // Chopped pieces: three small cubes of the ingredient's colour.
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 1.5;
    for (const [ox, oy] of [[-s * 0.55, -s * 0.3], [s * 0.45, -s * 0.45], [0, s * 0.45]]) {
      ctx.beginPath();
      ctx.rect(ox - s * 0.32, oy - s * 0.32, s * 0.64, s * 0.64);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = ing.color;
  ctx.strokeStyle = ing.dark;
  ctx.lineWidth = 2;
  switch (ing.shape) {
    case 'noodle': {
      ctx.strokeStyle = ing.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        for (let t = 0; t <= Math.PI; t += 0.2) {
          const px = -s + (t / Math.PI) * 2 * s;
          const py = i * s * 0.45 + Math.sin(t * 3) * s * 0.22;
          if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      break;
    }
    case 'drumstick': {
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.1, s * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#fff8ea';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(s * 0.3, s * 0.3);
      ctx.lineTo(s * 0.85, s * 0.85);
      ctx.stroke();
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.arc(s * 0.85, s * 0.85, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'prawn': {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, Math.PI * 0.15, Math.PI * 1.5);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.35, -s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pepper': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.5);
      ctx.quadraticCurveTo(0, -s * 0.95, s * 0.55, -s * 0.5);
      ctx.quadraticCurveTo(s * 0.75, s * 0.4, s * 0.4, s * 0.75);
      ctx.quadraticCurveTo(0, s * 0.6, -s * 0.4, s * 0.75);
      ctx.quadraticCurveTo(-s * 0.75, s * 0.4, -s * 0.55, -s * 0.5);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#4d8f3f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.quadraticCurveTo(s * 0.15, -s * 1.05, s * 0.35, -s * 1.05);
      ctx.stroke();
      break;
    }
    case 'mushroom': {
      ctx.beginPath();
      ctx.arc(0, -s * 0.15, s * 0.8, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f6ead2';
      ctx.beginPath();
      ctx.rect(-s * 0.28, -s * 0.15, s * 0.56, s * 0.85);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.45, s * 0.14, 0, Math.PI * 2);
      ctx.arc(s * 0.3, -s * 0.6, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.85, s * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f2a93b';
      ctx.beginPath();
      ctx.arc(s * 0.1, -s * 0.05, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chili': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, -s * 0.2);
      ctx.quadraticCurveTo(0, -s * 0.9, s * 0.7, -s * 0.55);
      ctx.quadraticCurveTo(s * 0.95, -s * 0.2, s * 0.55, s * 0.15);
      ctx.quadraticCurveTo(0, s * 0.55, -s * 0.8, -s * 0.2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#4d8f3f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, -s * 0.2);
      ctx.quadraticCurveTo(-s * 1.05, -s * 0.55, -s * 0.85, -s * 0.75);
      ctx.stroke();
      break;
    }
    case 'herb': {
      ctx.strokeStyle = ing.dark;
      ctx.fillStyle = ing.color;
      for (const ang of [-0.6, 0, 0.6]) {
        ctx.save();
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.5, s * 0.3, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = '#4d8f3f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, s * 0.8);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

export function drawDishIcon(ctx, dish, x, y, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  // Plate.
  ctx.fillStyle = '#f7ead2';
  ctx.strokeStyle = '#d9c49a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.15, s, s * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // The food itself: a steaming mound in the dish's colour.
  ctx.fillStyle = dish.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(-s * 0.3, -s * 0.1, s * 0.42, 0, Math.PI * 2);
  ctx.arc(s * 0.25, -s * 0.22, s * 0.4, 0, Math.PI * 2);
  ctx.arc(0, -s * 0.35, s * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Garnish: a herb sprig and a chili curl on top.
  ctx.fillStyle = '#7fc96b';
  ctx.beginPath();
  ctx.ellipse(-s * 0.15, -s * 0.55, s * 0.16, s * 0.3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d7263d';
  ctx.beginPath();
  ctx.arc(s * 0.3, -s * 0.5, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------- room

function drawRoom(ctx, t) {
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Tiled kitchen floor.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 152, VIEW.width, VIEW.height - 152);
  ctx.fillStyle = PALETTE.floorTile;
  for (let y = 152; y < VIEW.height; y += 56) {
    for (let x = ((y / 56) % 2) * 56; x < VIEW.width; x += 112) {
      ctx.fillRect(x, y, 54, 54);
    }
  }
  // Warm glow from the string lights.
  const glow = ctx.createRadialGradient(640, 120, 40, 640, 120, 700);
  glow.addColorStop(0, 'rgba(255,180,90,0.16)');
  glow.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // String lights across the top of the room.
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.quadraticCurveTo(640, 150, VIEW.width, 96);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 76;
    const sag = Math.sin((x / VIEW.width) * Math.PI) * 26;
    const y = 96 + sag;
    const hue = ['#ffd166', '#ff7a2f', '#7fc96b', '#ff5a7a'][i % 4];
    const flicker = 0.75 + Math.sin(t / 300 + i * 1.7) * 0.2;
    ctx.globalAlpha = flicker;
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.arc(x, y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = flicker * 0.25;
    ctx.beginPath();
    ctx.arc(x, y + 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Paper lanterns in the corners.
  for (const [lx, hue] of [[70, '#ff5a5a'], [1210, '#ffd166']]) {
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.ellipse(lx, 120, 26, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(lx, 120, 26, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.moveTo(lx, 86);
    ctx.lineTo(lx, 60);
    ctx.stroke();
  }
}

function drawStationBase(ctx, station, highlight) {
  ctx.fillStyle = PALETTE.woodDark;
  roundRect(ctx, station.x - 4, station.y + 8, station.w + 8, station.h + 4, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.wood;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, station.x + 6, station.y + 6, station.w - 12, 26, 6);
  ctx.fill();
  if (highlight) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    roundRect(ctx, station.x - 6, station.y - 6, station.w + 12, station.h + 12, 14);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  text(ctx, station.label, station.x + station.w / 2, station.y + 25, 15, PALETTE.ink, 'center', true);
  text(ctx, station.sub, station.x + station.w / 2, station.y + station.h - 8, 11, 'rgba(247,234,210,0.75)', 'center');
}

// ------------------------------------------------------------------ orders

function drawOrderRail(ctx, board) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 60, VIEW.width, 92);
  text(ctx, 'ORDER BOARD', 24, 84, 13, PALETTE.brass, 'left', true);
  if (board.tickets.length === 0) {
    text(ctx, 'No orders yet — the night is young…', 24, 122, 16, 'rgba(247,234,210,0.6)', 'left', false, 'italic Georgia, serif');
  }
  board.tickets.forEach((ticket, i) => {
    const x = 150 + i * 216;
    const y = 66;
    const w = 204;
    const h = 80;
    const ratio = board.patienceRatio(ticket);
    const urgent = ratio < 0.35;
    ctx.fillStyle = ticket.golden ? '#3a2b12' : '#241a2e';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = ticket.golden ? PALETTE.gold : (urgent ? PALETTE.danger : '#6b5578');
    ctx.lineWidth = ticket.golden ? 3 : 2;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
    if (ticket.golden) text(ctx, '★ GOLDEN ★', x + w - 8, y + 16, 10, PALETTE.gold, 'right', true);
    text(ctx, ticket.recipe.name, x + 10, y + 22, 15, PALETTE.cream, 'left', true);
    ticket.recipe.needs.forEach((id, j) => {
      drawIngredientIcon(ctx, id, x + 24 + j * 34, y + 46, 26);
    });
    text(ctx, `${ticket.recipe.coins}c`, x + w - 10, y + 52, 14, PALETTE.gold, 'right', true);
    // Patience bar.
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, x + 10, y + 66, w - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = ratio > 0.5 ? PALETTE.leaf : ratio > 0.25 ? PALETTE.gold : PALETTE.danger;
    if (urgent && Math.floor(performance.now() / 300) % 2 === 0) ctx.fillStyle = '#fff';
    roundRect(ctx, x + 10, y + 66, (w - 20) * ratio, 8, 4);
    ctx.fill();
  });
}

// ------------------------------------------------------------------ chef

function drawChef(ctx, chef, t) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : Math.sin(t / 500) * 1;
  const x = chef.x;
  const y = chef.y + bob * 0.4;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.fillStyle = '#2e2a3a';
  const step = chef.moving ? Math.sin(chef.walkPhase) * 6 : 0;
  ctx.fillRect(x - 12 + step, y + 8, 9, 18);
  ctx.fillRect(x + 3 - step, y + 8, 9, 18);
  // Apron body.
  ctx.fillStyle = '#f7ead2';
  roundRect(ctx, x - 18, y - 12, 36, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#c96b4a';
  ctx.fillRect(x - 18, y - 2, 36, 5);
  // Head + toque.
  ctx.fillStyle = '#f2c09a';
  ctx.beginPath();
  ctx.arc(x, y - 22, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8ea';
  ctx.beginPath();
  ctx.arc(x - 7, y - 32, 8, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 32, 8, 0, Math.PI * 2);
  ctx.arc(x, y - 36, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 12, y - 34, 24, 8);
  // Eyes look where the chef faces.
  ctx.fillStyle = '#241722';
  ctx.beginPath();
  ctx.arc(x + chef.facing * 4 - 4, y - 23, 1.8, 0, Math.PI * 2);
  ctx.arc(x + chef.facing * 4 + 4, y - 23, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, held up high.
  chef.hands.forEach((item, i) => {
    const ix = x - (chef.hands.length - 1) * 16 + i * 32;
    const iy = y - 52;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(ix, iy, 15, 0, Math.PI * 2);
    ctx.fill();
    if (item.kind === 'plate') drawDishIcon(ctx, item.dish, ix, iy, 26);
    else drawIngredientIcon(ctx, item.id, ix, iy, 24, item.chopped);
  });
}

// ------------------------------------------------------------------ render

export class Renderer {
  draw(ctx, game, t) {
    drawRoom(ctx, t);
    drawOrderRail(ctx, game.board);
    this.drawStations(ctx, game, t);
    this.drawWalkHint(ctx, game);
    drawChef(ctx, game.chef, t);
    game.particles.draw(ctx);
    this.drawHandsTray(ctx, game);
    this.drawHud(ctx, game, t);
    if (game.phase === 'title') this.drawTitle(ctx, game, t);
    else if (game.phase === 'daydone') this.drawDayDone(ctx, game, t);
    else if (game.phase === 'gameover') this.drawGameOver(ctx, game, t);
    if (game.toast) this.drawToast(ctx, game);
  }

  drawStations(ctx, game, t) {
    const { board, wok, plating, chef } = game;
    const hover = game.hoverStation;

    // Pantry crates.
    drawStationBase(ctx, STATIONS.pantry, hover === 'pantry');
    for (const crate of PANTRY_CRATES) {
      const ing = INGREDIENTS[crate.ingredient];
      ctx.fillStyle = '#3a2a1a';
      roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 6);
      ctx.fill();
      ctx.fillStyle = ing.color;
      ctx.fillRect(crate.x + 4, crate.y + 4, crate.w - 8, 6);
      drawIngredientIcon(ctx, crate.ingredient, crate.x + crate.w / 2, crate.y + 32, 26);
      text(ctx, ing.name, crate.x + crate.w / 2, crate.y + crate.h - 2, 9, PALETTE.cream, 'center', true);
    }

    // Chopping board.
    drawStationBase(ctx, STATIONS.board, hover === 'board');
    ctx.fillStyle = '#e8c89a';
    roundRect(ctx, STATIONS.board.x + 30, STATIONS.board.y + 40, 164, 62, 8);
    ctx.fill();
    ctx.strokeStyle = '#b98a5a';
    ctx.lineWidth = 2;
    roundRect(ctx, STATIONS.board.x + 30, STATIONS.board.y + 40, 164, 62, 8);
    ctx.stroke();
    game.choppingBoard.slots.forEach((slot, i) => {
      const sx = STATIONS.board.x + 80 + i * 70;
      const sy = STATIONS.board.y + 72;
      drawIngredientIcon(ctx, slot.id, sx, sy, 34, slot.progress >= 1);
      if (slot.progress < 1) {
        ctx.strokeStyle = '#241722';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sx, sy, 22, -Math.PI / 2, -Math.PI / 2 + slot.progress * Math.PI * 2);
        ctx.stroke();
        // The knife, chopping.
        const ang = -0.5 + Math.sin(t / 90 + i) * 0.45;
        ctx.save();
        ctx.translate(sx + 18, sy - 14);
        ctx.rotate(ang);
        ctx.fillStyle = '#cfd6dd';
        ctx.fillRect(-2, -16, 5, 22);
        ctx.fillStyle = '#5d3620';
        ctx.fillRect(-2, 6, 5, 10);
        ctx.restore();
      }
    });
    if (game.choppingBoard.slots.length === 0) {
      text(ctx, 'click an ingredient, then click here', STATIONS.board.x + 112, STATIONS.board.y + 76, 11, '#8a6a4a', 'center', false, 'italic Georgia, serif');
    }

    // Wok station.
    drawStationBase(ctx, STATIONS.wok, hover === 'wok');
    const wx = STATIONS.wok.x + STATIONS.wok.w / 2;
    const wy = STATIONS.wok.y + 92;
    // The wok itself.
    ctx.fillStyle = '#1c1c22';
    ctx.beginPath();
    ctx.ellipse(wx, wy + 6, 74, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a4a55';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(wx, wy + 6, 74, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2e2e38';
    ctx.beginPath();
    ctx.ellipse(wx, wy, 66, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    // Flames licking out from under the wok, drawn after it so they show.
    const flameH = wok.isEmpty ? 6 : 12 + Math.sin(t / 120) * 4 + (wok.done ? 8 : 0);
    ctx.fillStyle = PALETTE.flame;
    for (const [fx, fw] of [[-52, 22], [-18, 26], [16, 26], [48, 22]]) {
      ctx.beginPath();
      ctx.moveTo(wx + fx - fw / 2, wy + 36);
      ctx.quadraticCurveTo(wx + fx, wy + 36 - flameH - 8, wx + fx + fw / 2, wy + 36);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.ember;
    for (const [fx, fw] of [[-34, 16], [0, 20], [32, 16]]) {
      ctx.beginPath();
      ctx.moveTo(wx + fx - fw / 2, wy + 36);
      ctx.quadraticCurveTo(wx + fx, wy + 36 - flameH * 0.6 - 4, wx + fx + fw / 2, wy + 36);
      ctx.closePath();
      ctx.fill();
    }
    // Contents.
    wok.contents.forEach((id, i) => {
      drawIngredientIcon(ctx, id, wx - 34 + i * 34, wy - 2, 30, true);
    });
    if (wok.done && wok.dish) {
      drawDishIcon(ctx, wok.dish, wx, wy - 6, 52);
      text(ctx, wok.dish.name.toUpperCase() + ' — READY!', wx, wy - 44, 13, PALETTE.gold, 'center', true);
    } else if (wok.burnt) {
      text(ctx, 'BURNT! dump it in the compost', wx, wy - 40, 13, PALETTE.danger, 'center', true);
    } else if (!wok.isEmpty) {
      // Cook progress as a gauge ring over the top of the wok — a top
      // semicircle, so the arc can never reach the caption beneath the wok.
      const gaugeStart = Math.PI;
      const gaugeSweep = Math.PI;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(wx, wy, 58, gaugeStart, gaugeStart + gaugeSweep);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(wx, wy, 58, gaugeStart, gaugeStart + wok.cookProgress * gaugeSweep);
      ctx.stroke();
      text(ctx, `${Math.round(wok.cookProgress * 100)}%`, wx - 98, wy + 8, 13, PALETTE.gold, 'center', true);
    } else {
      text(ctx, 'add chopped + raw ingredients', wx, wy - 6, 11, 'rgba(247,234,210,0.8)', 'center', false, 'italic Georgia, serif');
    }

    // Plating counter.
    drawStationBase(ctx, STATIONS.plating, hover === 'plating');
    plating.plates.forEach((dish, i) => {
      const px = STATIONS.plating.x + 60 + i * 110;
      const py = STATIONS.plating.y + 78;
      drawDishIcon(ctx, dish, px, py, 56);
      text(ctx, dish.name, px, py + 44, 11, PALETTE.cream, 'center', true);
    });
    if (plating.plates.length === 0) {
      text(ctx, 'finished dishes land here', STATIONS.plating.x + 136, STATIONS.plating.y + 78, 11, 'rgba(247,234,210,0.55)', 'center', false, 'italic Georgia, serif');
    }

    // Serving window.
    drawStationBase(ctx, STATIONS.serving, hover === 'serving');
    ctx.fillStyle = '#120b1c';
    roundRect(ctx, STATIONS.serving.x + 24, STATIONS.serving.y + 38, 224, 62, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 3;
    roundRect(ctx, STATIONS.serving.x + 24, STATIONS.serving.y + 38, 224, 62, 8);
    ctx.stroke();
    text(ctx, '★ SERVE ★', STATIONS.serving.x + 136, STATIONS.serving.y + 62, 15, PALETTE.gold, 'center', true);
    text(ctx, 'match a ticket · ring the bell', STATIONS.serving.x + 136, STATIONS.serving.y + 86, 11, 'rgba(247,234,210,0.7)', 'center');
    // The service bell.
    ctx.fillStyle = PALETTE.brass;
    ctx.beginPath();
    ctx.arc(STATIONS.serving.x + 136, STATIONS.serving.y + 116, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(STATIONS.serving.x + 122, STATIONS.serving.y + 116, 28, 4);

    // Compost bin.
    drawStationBase(ctx, STATIONS.trash, hover === 'trash');
    ctx.fillStyle = '#3f6b3a';
    roundRect(ctx, STATIONS.trash.x + 30, STATIONS.trash.y + 38, 60, 44, 6);
    ctx.fill();
    ctx.fillStyle = '#2c4d29';
    ctx.fillRect(STATIONS.trash.x + 24, STATIONS.trash.y + 32, 72, 10);
    text(ctx, '♻', STATIONS.trash.x + 60, STATIONS.trash.y + 68, 20, '#d9f2c4', 'center');
  }

  drawWalkHint(ctx, game) {
    const chef = game.chef;
    if (!chef.target || !chef.queuedStation) return;
    ctx.strokeStyle = 'rgba(255,209,102,0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 10]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(chef.x, chef.y);
    ctx.lineTo(chef.target.x, chef.target.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const s = chef.queuedStation;
    text(ctx, `→ ${s.label}`, s.x + s.w / 2, s.y + s.h + 16, 12, PALETTE.gold, 'center', true);
  }

  drawHandsTray(ctx, game) {
    const chef = game.chef;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, 24, 664, 300, 44, 10);
    ctx.fill();
    text(ctx, 'HANDS:', 36, 692, 13, PALETTE.brass, 'left', true);
    if (chef.hands.length === 0) {
      text(ctx, 'empty — click a pantry crate', 104, 692, 13, 'rgba(247,234,210,0.6)', 'left', false, 'italic Georgia, serif');
    } else {
      chef.hands.forEach((item, i) => {
        const ix = 120 + i * 40;
        if (item.kind === 'plate') drawDishIcon(ctx, item.dish, ix, 686, 30);
        else drawIngredientIcon(ctx, item.id, ix, 686, 28, item.chopped);
      });
    }
    text(ctx, 'WASD / arrows move · E or click works a station · M mute', 640, 692, 13, 'rgba(247,234,210,0.65)', 'center');
  }

  drawHud(ctx, game, t) {
    // Header bar.
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, VIEW.width, 56);
    text(ctx, 'EMBER & THYME', 24, 36, 24, PALETTE.gold, 'left', true);
    text(ctx, 'night-market wok station', 240, 36, 13, 'rgba(247,234,210,0.7)', 'left', false, 'italic Georgia, serif');

    const day = game.dayIndex + 1;
    text(ctx, `DAY ${day} / 3`, 560, 36, 18, PALETTE.cream, 'center', true);

    // The day timer: big, and red when the shift is nearly over.
    const low = game.secondsLeft <= 15;
    const timerColor = low ? PALETTE.danger : PALETTE.cream;
    const mm = Math.floor(Math.max(0, game.secondsLeft) / 60);
    const ss = String(Math.floor(Math.max(0, game.secondsLeft) % 60)).padStart(2, '0');
    ctx.fillStyle = low && Math.floor(t / 300) % 2 === 0 ? 'rgba(255,90,90,0.25)' : 'rgba(255,255,255,0.08)';
    roundRect(ctx, 640, 8, 110, 40, 8);
    ctx.fill();
    text(ctx, `${mm}:${ss}`, 695, 38, 24, timerColor, 'center', true);

    text(ctx, `SCORE ${game.score}`, 800, 36, 18, PALETTE.cream, 'left', true);
    text(ctx, `◉ ${game.coins}c`, 950, 36, 18, PALETTE.gold, 'left', true);
    if (game.combo >= 2) {
      ctx.fillStyle = PALETTE.ember;
      roundRect(ctx, 1060, 12, 110, 32, 16);
      ctx.fill();
      text(ctx, `COMBO ×${game.combo}`, 1115, 35, 15, '#fff', 'center', true);
    }
    text(ctx, game.sfx.muted ? '🔇 M' : '🔊 M', 1210, 36, 15, 'rgba(247,234,210,0.8)', 'center');

    // Rush hour lives at the free right end of the order rail (four tickets
    // end at x≈1002), so it never covers a ticket or a station label.
    if (game.board.rush && game.phase === 'playing') {
      const pulse = 0.7 + Math.sin(t / 160) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = PALETTE.ember;
      roundRect(ctx, 1020, 66, 236, 80, 10);
      ctx.fill();
      ctx.globalAlpha = 1;
      text(ctx, '🔥 RUSH HOUR', 1138, 98, 17, '#fff', 'center', true);
      text(ctx, 'golden tickets pay double!', 1138, 122, 13, '#fff', 'center');
    }
  }

  drawToast(ctx, game) {
    ctx.globalAlpha = Math.min(1, game.toast.lifeMs / 400);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, 440, 600, 400, 40, 20);
    ctx.fill();
    text(ctx, game.toast.message, 640, 627, 16, game.toast.color ?? PALETTE.cream, 'center', true);
    ctx.globalAlpha = 1;
  }

  drawTitle(ctx, game, t) {
    ctx.fillStyle = 'rgba(10,6,16,0.82)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    const bob = Math.sin(t / 500) * 6;
    text(ctx, 'EMBER & THYME', 640, 210 + bob, 64, PALETTE.gold, 'center', true);
    text(ctx, 'a night-market wok station', 640, 250 + bob, 22, PALETTE.cream, 'center', false, 'italic Georgia, serif');
    text(ctx, 'The lanterns are lit, the wok is hot, and the tickets are coming in.', 640, 300, 17, 'rgba(247,234,210,0.85)', 'center');
    text(ctx, 'Grab ingredients → chop them → wok them → plate → serve before patience runs out.', 640, 330, 17, 'rgba(247,234,210,0.85)', 'center');
    text(ctx, 'Golden tickets in Rush Hour pay double. Burnt food goes in the compost.', 640, 360, 17, 'rgba(247,234,210,0.85)', 'center');
    text(ctx, 'WASD / arrows to walk · click a station to work it · E interacts · M mutes', 640, 400, 15, PALETTE.brass, 'center');
    const pulse = 0.75 + Math.sin(t / 300) * 0.25;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = PALETTE.ember;
    roundRect(ctx, 520, 440, 240, 56, 28);
    ctx.fill();
    ctx.globalAlpha = 1;
    text(ctx, '▶  START THE SHIFT', 640, 476, 20, '#fff', 'center', true);
    text(ctx, `Best shift so far: ${game.bestScore} points · ${game.bestCoins} coins`, 640, 540, 14, 'rgba(247,234,210,0.6)', 'center');
  }

  drawDayDone(ctx, game, t) {
    ctx.fillStyle = 'rgba(10,6,16,0.78)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    const day = game.dayIndex + 1;
    text(ctx, `DAY ${day} COMPLETE`, 640, 220, 48, PALETTE.gold, 'center', true);
    text(ctx, `Served ${game.dayStats.served} dishes · ${game.dayStats.expired} tickets walked out · ${game.dayStats.earned} coins earned`, 640, 280, 19, PALETTE.cream, 'center');
    text(ctx, `Score ${game.score} · Coins ${game.coins}c · Combo best ×${game.bestCombo}`, 640, 320, 19, PALETTE.cream, 'center');
    if (day < 3) {
      text(ctx, `Day ${day + 1} brings faster tickets and shorter tempers.`, 640, 360, 16, 'rgba(247,234,210,0.8)', 'center', false, 'italic Georgia, serif');
      ctx.fillStyle = PALETTE.ember;
      roundRect(ctx, 520, 400, 240, 56, 28);
      ctx.fill();
      text(ctx, `▶  START DAY ${day + 1}`, 640, 436, 20, '#fff', 'center', true);
    } else {
      text(ctx, 'That was the last shift of the festival.', 640, 360, 16, 'rgba(247,234,210,0.8)', 'center', false, 'italic Georgia, serif');
    }
  }

  drawGameOver(ctx, game, t) {
    ctx.fillStyle = 'rgba(10,6,16,0.85)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'THE FESTIVAL ENDS', 640, 200, 48, PALETTE.gold, 'center', true);
    text(ctx, 'Three nights, one very hot wok.', 640, 244, 20, PALETTE.cream, 'center', false, 'italic Georgia, serif');
    text(ctx, `Final score ${game.score} · ${game.coins} coins earned · ${game.totalServed} dishes served`, 640, 300, 20, PALETTE.cream, 'center');
    text(ctx, `${game.totalExpired} tickets walked away hungry.`, 640, 336, 17, 'rgba(247,234,210,0.75)', 'center');
    const verdict = game.score >= 600 ? 'The night market will remember your name.' :
      game.score >= 300 ? 'A solid stall — the regulars will be back.' :
      'The wok forgives. Come back tomorrow night.';
    text(ctx, verdict, 640, 380, 17, PALETTE.brass, 'center', false, 'italic Georgia, serif');
    ctx.fillStyle = PALETTE.ember;
    roundRect(ctx, 520, 420, 240, 56, 28);
    ctx.fill();
    text(ctx, '↻  PLAY AGAIN', 640, 456, 20, '#fff', 'center', true);
  }
}
