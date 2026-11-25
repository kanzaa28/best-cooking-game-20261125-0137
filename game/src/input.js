// Ember & Thyme — keyboard and mouse.
// Clicks are translated into canvas coordinates and handed to the game as
// "the player clicked here"; keys are tracked as a live set the chef reads
// every frame. Nothing here decides what a click means — main.js does.

import { VIEW } from './config.js';

export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0 };
    this.attach();
  }

  toGameCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW.width,
      y: ((clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  attach() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }
      if (e.repeat) return;
      this.keys.add(key);
      this.game.onKey(key);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => this.keys.clear());

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse = this.toGameCoords(e.clientX, e.clientY);
      this.game.onHover(this.mouse.x, this.mouse.y);
    });
    this.canvas.addEventListener('click', (e) => {
      const p = this.toGameCoords(e.clientX, e.clientY);
      this.game.onClick(p.x, p.y);
    });
    // Touch: a tap is a click.
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const p = this.toGameCoords(touch.clientX, touch.clientY);
      this.game.onClick(p.x, p.y);
    }, { passive: false });
  }
}
