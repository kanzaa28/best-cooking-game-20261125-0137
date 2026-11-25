// Ember & Thyme — particles and floating text.
// Steam over the wok, embers under it, sparkles on a finished dish, and the
// little "+24" that floats up when a customer pays. Pure decoration: the
// game never reads a particle back.

export class Particles {
  constructor() {
    this.list = []; // { kind, x, y, vx, vy, life, maxLife, size, color }
    this.texts = []; // { text, x, y, life, maxLife, color, size }
  }

  spawn(kind, x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = opts.speed ?? 30;
      this.list.push({
        kind,
        x: x + (Math.random() - 0.5) * (opts.spread ?? 10),
        y: y + (Math.random() - 0.5) * (opts.spread ?? 6),
        vx: Math.cos(angle) * speed * Math.random(),
        vy: (opts.vy ?? -speed) * (0.5 + Math.random() * 0.5),
        life: 0,
        maxLife: (opts.lifeMs ?? 900) * (0.7 + Math.random() * 0.6),
        size: (opts.size ?? 4) * (0.7 + Math.random() * 0.6),
        color: opts.color ?? '#ffffff',
      });
    }
  }

  steam(x, y) {
    this.spawn('steam', x, y, 1, { speed: 12, vy: -34, lifeMs: 1400, size: 7, color: 'rgba(255,255,255,0.5)', spread: 26 });
  }

  ember(x, y) {
    this.spawn('ember', x, y, 1, { speed: 26, vy: -58, lifeMs: 800, size: 3, color: '#ffb347', spread: 40 });
  }

  sparkle(x, y) {
    this.spawn('sparkle', x, y, 6, { speed: 20, vy: -20, lifeMs: 700, size: 3, color: '#ffd166', spread: 30 });
  }

  chopBits(x, y, color) {
    this.spawn('bit', x, y, 8, { speed: 70, vy: -30, lifeMs: 450, size: 3, color, spread: 8 });
  }

  floatText(text, x, y, color = '#ffd166', size = 22) {
    this.texts.push({ text, x, y, life: 0, maxLife: 1400, color, size });
  }

  update(dtMs) {
    for (const p of this.list) {
      p.life += dtMs;
      p.x += (p.vx * dtMs) / 1000;
      p.y += (p.vy * dtMs) / 1000;
      if (p.kind === 'steam') p.vy -= 6 * (dtMs / 1000);
      if (p.kind === 'ember') { p.vx += (Math.random() - 0.5) * 20; p.vy -= 10 * (dtMs / 1000); }
    }
    this.list = this.list.filter((p) => p.life < p.maxLife);
    for (const t of this.texts) {
      t.life += dtMs;
      t.y -= (34 * dtMs) / 1000;
    }
    this.texts = this.texts.filter((t) => t.life < t.maxLife);
  }

  draw(ctx) {
    for (const p of this.list) {
      const a = 1 - p.life / p.maxLife;
      ctx.globalAlpha = p.kind === 'steam' ? a * 0.45 : a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.kind === 'steam' ? 1 + p.life / p.maxLife : 1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const a = 1 - t.life / t.maxLife;
      ctx.globalAlpha = a;
      ctx.font = `bold ${t.size}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
