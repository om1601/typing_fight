// storage.js — wraps localStorage for leaderboard + settings persistence
const Storage = {
  KEY_SCORES: 'tf_leaderboard_v1',
  KEY_SETTINGS: 'tf_settings_v1',

  getScores() {
    try {
      const raw = localStorage.getItem(this.KEY_SCORES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },

  addScore(entry) {
    const scores = this.getScores();
    scores.push(entry);
    scores.sort((a, b) => b.wpm - a.wpm);
    localStorage.setItem(this.KEY_SCORES, JSON.stringify(scores.slice(0, 25)));
  },

  bestStats() {
    const scores = this.getScores();
    if (!scores.length) return { wpm: 0, accuracy: 0, combo: 0, fastestWin: null };
    return {
      wpm: Math.max(...scores.map(s => s.wpm)),
      accuracy: Math.max(...scores.map(s => s.accuracy)),
      combo: Math.max(...scores.map(s => s.combo)),
      fastestWin: scores.filter(s => s.result === 'win').sort((a, b) => a.timeMs - b.timeMs)[0] || null
    };
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(this.KEY_SETTINGS);
      return raw ? JSON.parse(raw) : { muted: false, volume: 0.6, darkMode: true, playerName: 'Player' };
    } catch (e) { return { muted: false, volume: 0.6, darkMode: true, playerName: 'Player' }; }
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(settings));
  }
};
