// player.js — the human-controlled fighter. Movement is driven entirely by typing performance.
class Player extends Stickman {
  constructor(x, y) {
    super(x, y, 1, '#3fd6ff');
    this.maxHP = 100;
    this.hp = 100;
    this.combo = 0;
    this.maxCombo = 0;
    this.wordsTyped = 0;
    this.mistakes = 0;
    this.totalCharsTyped = 0;
    this.totalCorrectChars = 0;
    this.damageDealt = 0;
    this.lastWordMs = 0;
    this.wpmSamples = [];
  }

  get accuracy() {
    if (this.totalCharsTyped === 0) return 100;
    return Utils.clamp((this.totalCorrectChars / this.totalCharsTyped) * 100, 0, 100);
  }

  get avgWpm() {
    if (!this.wpmSamples.length) return 0;
    return Math.round(this.wpmSamples.reduce((a, b) => a + b, 0) / this.wpmSamples.length);
  }

  registerWordComplete(word, timeMs, mistakesInWord) {
    this.wordsTyped++;
    this.totalCharsTyped += word.length;
    this.totalCorrectChars += Math.max(0, word.length - mistakesInWord);
    this.mistakes += mistakesInWord;

    const seconds = Math.max(timeMs / 1000, 0.15);
    const wpm = Math.round((word.length / 5) / (seconds / 60));
    this.wpmSamples.push(Utils.clamp(wpm, 0, 260));
    if (this.wpmSamples.length > 12) this.wpmSamples.shift();

    if (mistakesInWord === 0) {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    } else {
      this.combo = 0;
    }
    return wpm;
  }

  comboMultiplier() {
    if (this.combo >= 30) return 3.0;
    if (this.combo >= 15) return 2.2;
    if (this.combo >= 7) return 1.7;
    if (this.combo >= 3) return 1.3;
    return 1.0;
  }

  // Chooses which attack animation to fire based on recent typing speed and combo —
  // deliberately mixes boxing (jab/hook), kicking, and a wrestling throw for variety.
  chooseAttack(wpm, wordLen) {
    if (this.combo >= 30) return 'special';
    if (this.combo >= 15 && this.combo % 5 === 0) return 'grapple'; // wrestling throw on big combo milestones
    if (wpm >= 95) return 'roundhouse';
    if (wpm >= 75) return 'uppercut';
    if (wpm >= 55) return 'kick';
    if (wpm >= 30) return 'hook';
    return 'jab';
  }

  takeDamage(amount) {
    this.hp = Utils.clamp(this.hp - amount, 0, this.maxHP);
    this.triggerHit(1);
    this.clearQueue();
    this.playAction('hit', 0.3);
    return this.hp <= 0;
  }

  attack(kind) {
    const durations = { jab: 0.18, hook: 0.26, punch: 0.22, kick: 0.28, uppercut: 0.3, roundhouse: 0.4, grapple: 0.7, special: 0.9 };
    this.playAction(kind, durations[kind] || 0.25);
  }
}