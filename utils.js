// utils.js — small shared helpers used across every module
const Utils = {
  rand(min, max) { return Math.random() * (max - min) + min; },
  randInt(min, max) { return Math.floor(this.rand(min, max + 1)); },
  choice(arr) { return arr[this.randInt(0, arr.length - 1)]; },
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
  easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  now() { return performance.now(); },
  uid() { return Math.random().toString(36).slice(2, 10); },
  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  },
  gradeFromScore(score) {
    // score is a 0-100 composite of accuracy, wpm-normalized, combo
    if (score >= 92) return 'S';
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 45) return 'C';
    return 'D';
  }
};
