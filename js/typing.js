// typing.js — captures keystrokes, tracks the current word's typed state, and reports
// completed words back to the game loop with timing/mistake info.
class TypingManager {
  constructor() {
    this.pool = [];
    this.currentWord = '';
    this.typed = '';
    this.mistakesInWord = 0;
    this.wordStartTime = 0;
    this.active = false;
    this.onWordComplete = null; // callback(word, timeMs, mistakes)
    this.onKeystroke = null;    // callback(correct)
    this._keyHandler = this._handleKey.bind(this);
  }

  start(pool) {
    this.pool = pool;
    this.active = true;
    this.nextWord();
    window.addEventListener('keydown', this._keyHandler);
  }

  stop() {
    this.active = false;
    window.removeEventListener('keydown', this._keyHandler);
  }

  nextWord() {
    // avoid immediate repeats
    let w;
    do { w = Utils.choice(this.pool); } while (w === this.currentWord && this.pool.length > 1);
    this.currentWord = w;
    this.attempts = []; // one slot per typed keystroke: {char, correct}
    this.mistakesInWord = 0;
    this.wordStartTime = Utils.now();
  }

  _handleKey(e) {
    if (!this.active) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      this.attempts.pop();
      if (this.onKeystroke) this.onKeystroke(true, true);
      return;
    }
    if (e.key.length !== 1) return; // ignore modifier/arrow/etc keys
    if (this.attempts.length >= this.currentWord.length) return;
    e.preventDefault();

    const idx = this.attempts.length;
    const expected = this.currentWord[idx];
    const correct = expected !== undefined && e.key.toLowerCase() === expected.toLowerCase();
    this.attempts.push({ char: e.key.toLowerCase(), correct });
    if (!correct) this.mistakesInWord++;
    if (this.onKeystroke) this.onKeystroke(correct, false);

    if (this.attempts.length >= this.currentWord.length) {
      const timeMs = Utils.now() - this.wordStartTime;
      const word = this.currentWord;
      const mistakes = this.mistakesInWord;
      if (this.onWordComplete) this.onWordComplete(word, timeMs, mistakes);
      this.nextWord();
    }
  }

  // Returns [{char, state}] where state is 'correct' | 'wrong' | 'pending'
  getRenderState() {
    return this.currentWord.split('').map((ch, i) => {
      const attempt = this.attempts[i];
      let state = 'pending';
      if (attempt) state = attempt.correct ? 'correct' : 'wrong';
      return { char: ch, state };
    });
  }

  get progress() {
    return this.currentWord.length ? this.attempts.length / this.currentWord.length : 0;
  }
}
