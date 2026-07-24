// audio.js — all sound is synthesized with the WebAudio API, so no asset files are needed
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.6;
    this.musicNodes = null;
  }

  ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) { this.muted = m; }
  setVolume(v) { this.volume = v; }

  tone(freq, duration, type = 'square', vol = 1, glide = 0) {
    if (this.muted) return;
    this.ensureCtx();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + glide), ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  noise(duration, vol = 1) {
    if (this.muted) return;
    this.ensureCtx();
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    src.connect(gain).connect(ctx.destination);
    src.start();
  }

  keyClick() { this.tone(Utils.rand(900, 1200), 0.03, 'square', 0.15); }
  wrongKey() { this.tone(180, 0.08, 'sawtooth', 0.2); }
  punch() { this.noise(0.08, 0.5); this.tone(120, 0.08, 'square', 0.3, -60); }
  kick() { this.noise(0.12, 0.6); this.tone(90, 0.12, 'square', 0.35, -50); }
  special() { this.tone(400, 0.25, 'sawtooth', 0.4, 300); this.noise(0.2, 0.4); }
  hit() { this.noise(0.06, 0.4); }
  block() { this.tone(600, 0.05, 'triangle', 0.3); }
  explosion() { this.noise(0.4, 0.7); this.tone(60, 0.4, 'sawtooth', 0.5, -40); }
  victory() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'square', 0.3), i * 120));
  }
  defeat() {
    [400, 350, 300, 200].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.3), i * 150));
  }
  combo(level) { this.tone(500 + level * 40, 0.1, 'square', 0.25); }
  countdown() { this.tone(700, 0.15, 'sine', 0.3); }
  go() { this.tone(1000, 0.3, 'sine', 0.35); }

  startMusic() {
    if (this.musicNodes || this.muted) return;
    this.ensureCtx();
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = 0.08 * this.volume;
    master.connect(ctx.destination);
    const notes = [130.81, 146.83, 164.81, 130.81, 174.61, 164.81, 146.83, 130.81];
    let step = 0;
    const interval = setInterval(() => {
      if (!this.musicNodes) return;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = notes[step % notes.length];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(g).connect(master);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
      step++;
    }, 380);
    this.musicNodes = { master, interval };
  }

  stopMusic() {
    if (this.musicNodes) {
      clearInterval(this.musicNodes.interval);
      this.musicNodes.master.disconnect();
      this.musicNodes = null;
    }
  }
}
