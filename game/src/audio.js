// Ember & Thyme — sound, synthesized live with WebAudio.
// No audio files are shipped: every effect is an oscillator or a burst of
// filtered noise, so the game stays silent on disk and audible in play.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
  }

  unlock() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(freq, durMs, type = 'sine', gain = 0.12, slideTo = null) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + durMs / 1000);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + durMs / 1000);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + durMs / 1000 + 0.02);
    } catch { /* sound is decoration; never break the game */ }
  }

  noise(durMs, gain = 0.08, filterFreq = 1200) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * (durMs / 1000)));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + durMs / 1000);
      src.connect(filter).connect(g).connect(this.ctx.destination);
      src.start(t);
    } catch { /* ignore */ }
  }

  pickup() { this.tone(520, 70, 'triangle', 0.08, 700); }
  chop() { this.noise(90, 0.14, 900); this.tone(180, 60, 'square', 0.05, 120); }
  wokAdd() { this.noise(160, 0.1, 2400); }
  ding() { this.tone(880, 220, 'sine', 0.1); this.tone(1320, 260, 'sine', 0.06); }
  coin() { this.tone(988, 90, 'triangle', 0.1); setTimeout(() => this.tone(1319, 160, 'triangle', 0.1), 80); }
  error() { this.tone(160, 140, 'sawtooth', 0.07, 110); }
  expired() { this.tone(320, 300, 'sawtooth', 0.07, 140); }
  bell() { this.tone(1568, 320, 'sine', 0.09); this.tone(2093, 380, 'sine', 0.05); }
  dayStart() { this.tone(392, 140, 'triangle', 0.09); setTimeout(() => this.tone(523, 140, 'triangle', 0.09), 130); setTimeout(() => this.tone(659, 240, 'triangle', 0.09), 260); }

  // A looping filtered-noise sizzle while the wok is cooking.
  startSizzle() {
    if (!this.ctx || this.muted || this.sizzleNodes) return;
    try {
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      const g = this.ctx.createGain();
      g.gain.value = 0.028;
      src.connect(filter).connect(g).connect(this.ctx.destination);
      src.start();
      this.sizzleNodes = { src, g };
    } catch { /* ignore */ }
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.src.stop(); } catch { /* ignore */ }
    this.sizzleNodes = null;
  }
}
