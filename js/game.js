// game.js — orchestrates every module: state machine, main loop, damage rules, and screens.

const BACKGROUNDS = ['dojo', 'rooftop', 'forest', 'temple', 'cyber'];
const BG_COLORS = {
  dojo:    { sky: ['#2b1b2e', '#5c2a3a'], ground: '#241019', accent: '#ff9f5a' },
  rooftop: { sky: ['#0d1b2a', '#1b3350'], ground: '#0a1420', accent: '#ffb347' },
  forest:  { sky: ['#0f2419', '#1e3d2b'], ground: '#0a1a10', accent: '#7fd66b' },
  temple:  { sky: ['#241a0d', '#4a3418'], ground: '#1a1108', accent: '#e8c15a' },
  cyber:   { sky: ['#10041f', '#2b0a3d'], ground: '#0a0214', accent: '#ff4fd8' }
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ui = new UIManager();
    this.audio = new AudioManager();
    this.effects = new EffectsSystem();
    this.typing = new TypingManager();

    this.state = 'start';
    this.settings = Storage.getSettings();
    this.audio.setMuted(this.settings.muted);
    this.audio.setVolume(this.settings.volume);

    this.category = 'random';
    this.difficulty = 'medium';
    this.practiceMode = false;

    this.level = 1;
    this.wordsThisLevel = 0;
    this.bgIndex = 0;
    this.bgTime = 0;
    this.matchStart = 0;
    this.lastTime = 0;

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();

    this._bindMenus();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _resize() {
    const wrap = document.getElementById('canvasWrap');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewW = w; this.viewH = h;
    this.groundY = h * 0.72;
    if (this.player) { this.player.x = w * 0.26; this.player.y = this.groundY; }
    if (this.enemy) { this.enemy.x = w * 0.74; this.enemy.y = this.groundY; }
  }

  _bindMenus() {
    document.getElementById('btnPlay').onclick = () => this.goToSetup();
    document.getElementById('btnInstructions').onclick = () => this.ui.showScreen('instructionsScreen');
    document.getElementById('btnHighScores').onclick = () => this.showHighScores();
    document.querySelectorAll('.back-btn').forEach(b => b.onclick = () => this.ui.showScreen('startScreen'));

    document.querySelectorAll('.cat-btn').forEach(b => b.onclick = (e) => {
      document.querySelectorAll('.cat-btn').forEach(x => x.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      this.category = e.currentTarget.dataset.cat;
    });
    document.querySelectorAll('.diff-btn').forEach(b => b.onclick = (e) => {
      document.querySelectorAll('.diff-btn').forEach(x => x.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      this.difficulty = e.currentTarget.dataset.diff;
    });
    document.getElementById('practiceToggle').onchange = (e) => { this.practiceMode = e.target.checked; };
    document.getElementById('btnStartMatch').onclick = () => this.startCountdown();

    document.getElementById('btnPause').onclick = () => this.togglePause();
    document.getElementById('btnResume').onclick = () => this.togglePause();
    document.getElementById('btnQuitToMenu').onclick = () => this.quitToMenu();
    document.getElementById('btnRestartFromPause').onclick = () => { this.togglePause(); this.startCountdown(); };

    document.getElementById('btnPlayAgain').onclick = () => this.goToSetup();
    document.getElementById('btnViewStats').onclick = () => this.showStats();
    document.getElementById('btnStatsMenu').onclick = () => this.quitToMenu();
    document.getElementById('btnGOAgain').onclick = () => this.goToSetup();
    document.getElementById('btnGOMenu').onclick = () => this.quitToMenu();

    document.getElementById('btnMute').onclick = () => {
      this.settings.muted = !this.settings.muted;
      this.audio.setMuted(this.settings.muted);
      document.getElementById('btnMute').textContent = this.settings.muted ? '🔇' : '🔊';
      Storage.saveSettings(this.settings);
    };
    document.getElementById('volumeSlider').oninput = (e) => {
      this.settings.volume = parseFloat(e.target.value);
      this.audio.setVolume(this.settings.volume);
      Storage.saveSettings(this.settings);
    };
    document.getElementById('btnDarkMode').onclick = () => {
      this.settings.darkMode = !this.settings.darkMode;
      document.body.classList.toggle('light-mode', !this.settings.darkMode);
      Storage.saveSettings(this.settings);
    };
    document.getElementById('btnFullscreen').onclick = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen();
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state === 'playing') this.togglePause();
    });

    if (!this.settings.darkMode) document.body.classList.add('light-mode');
    document.getElementById('volumeSlider').value = this.settings.volume;
    document.getElementById('btnMute').textContent = this.settings.muted ? '🔇' : '🔊';
  }

  showHighScores() {
    const scores = Storage.getScores();
    const list = document.getElementById('highScoresList');
    if (!scores.length) {
      list.innerHTML = `<p class="empty-msg">No matches recorded yet. Play a round to set the first record!</p>`;
    } else {
      list.innerHTML = scores.slice(0, 10).map((s, i) => `
        <div class="score-row">
          <span class="rank">#${i + 1}</span>
          <span class="score-name">${s.name}</span>
          <span>${s.wpm} WPM</span>
          <span>${Math.round(s.accuracy)}% acc</span>
          <span>x${s.combo}</span>
          <span class="grade grade-${s.grade}">${s.grade}</span>
          <span class="result-${s.result}">${s.result === 'win' ? 'WIN' : 'LOSS'}</span>
        </div>`).join('');
    }
    this.ui.showScreen('highScoresScreen');
  }

  goToSetup() { this.ui.showScreen('setupScreen'); }

  quitToMenu() {
    this.typing.stop();
    this.audio.stopMusic();
    this.state = 'start';
    this.ui.showScreen('startScreen');
  }

  startCountdown() {
    this.ui.showScreen('gameScreen');
    this._resize();

    this.player = new Player(this.viewW * 0.26, this.groundY);
    this.enemy = new Enemy(this.viewW * 0.74, this.groundY);
    this.level = 1; this.wordsThisLevel = 0;
    this.enemy.setLevel(this.level);
    this.bgIndex = BACKGROUNDS.indexOf(Utils.choice(BACKGROUNDS));
    this.effects.particles = []; this.effects.floatingTexts = [];
    this.matchStart = Utils.now();

    this.state = 'countdown';
    this._countdownStep(3);
  }

  _countdownStep(n) {
    document.getElementById('countdownOverlay').classList.add('show');
    if (n > 0) {
      this.ui.setCountdown(n);
      this.audio.countdown();
      setTimeout(() => this._countdownStep(n - 1), 700);
    } else {
      this.ui.setCountdown('GO!');
      this.audio.go();
      setTimeout(() => {
        document.getElementById('countdownOverlay').classList.remove('show');
        this.beginMatch();
      }, 500);
    }
  }

  beginMatch() {
    this.state = 'playing';
    const pool = getWordPool(this.category, this.difficulty);
    this.typing.pool = pool;
    this.typing.onWordComplete = (word, timeMs, mistakes) => this.handleWordComplete(word, timeMs, mistakes);
    this.typing.onKeystroke = (correct, isBackspace) => { if (!isBackspace) correct ? this.audio.keyClick() : this.audio.wrongKey(); };
    this.typing.start(pool);
    this.audio.startMusic();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.typing.active = false;
      document.getElementById('pauseOverlay').classList.add('show');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.typing.active = true;
      document.getElementById('pauseOverlay').classList.remove('show');
    }
  }

  handleWordComplete(word, timeMs, mistakes) {
    const wpm = this.player.registerWordComplete(word, timeMs, mistakes);
    this.wordsThisLevel++;
    if (this.wordsThisLevel >= 8) { this.wordsThisLevel = 0; this.levelUp(); }

    if (mistakes > 0 && this.player.combo === 0) {
      this.player.attack('punch');
      this.effects.floatingNumber(this.player.x + 40, this.player.y - 90, 'MISS', '#ff5566');
      this.audio.wrongKey();
      return;
    }

    const kind = this.player.chooseAttack(wpm, word.length);
    const mult = this.player.comboMultiplier();
    const speedBonus = Utils.clamp(wpm / 8, 0, 16);
    const accuracyFactor = mistakes === 0 ? 1 : 0.35;
    const moveWeight = kind === 'grapple' ? 1.5 : kind === 'special' ? 1.3 : 1;
    let damage = (6 + speedBonus) * mult * accuracyFactor * moveWeight;
    damage = Utils.clamp(damage, 1, 60);

    this.player.attack(kind);
    this.player.damageDealt += damage;

    if (this.enemy.telegraphing) {
      this.enemy.interrupt();
      this.enemy.telegraphing = false;
      this.effects.comboText(this.viewW / 2, this.viewH * 0.3, 'INTERRUPTED!', '#ffdd55');
    }

    const impactDelay = { jab: 70, hook: 130, punch: 110, kick: 150, uppercut: 160, roundhouse: 220, grapple: 420, special: 480 }[kind] || 140;
    setTimeout(() => this.applyPlayerDamage(damage, kind), impactDelay);

    this.audio.combo(this.player.combo);
    if (this.player.combo === 3) this.ui.showComboBanner('COMBO x2!');
    if (this.player.combo === 7) this.ui.showComboBanner('COMBO x5!');
    if (this.player.combo === 15) this.ui.showComboBanner('SPECIAL MOVE READY!');
    if (this.player.combo === 30) this.ui.showComboBanner('ULTIMATE ATTACK!');

    if (wpm >= 100) this.effects.floatingNumber(this.player.x, this.player.y - 110, 'PERFECT!', '#ffd75a', true);
    else if (wpm >= 70) this.effects.floatingNumber(this.player.x, this.player.y - 110, 'EXCELLENT!', '#7fe6ff', true);
    else if (wpm >= 45) this.effects.floatingNumber(this.player.x, this.player.y - 110, 'AMAZING!', '#7fd66b', true);
  }

  applyPlayerDamage(damage, kind) {
    if (!this.enemy || this.enemy.hp <= 0) return;
    const strike = this.player.getStrikePoint();
    if (kind === 'special') { this.audio.special(); this.effects.zoomPulse(1.08); this.effects.flashScreen('#3fd6ff', 0.25); }
    else if (kind === 'grapple') {
      this.audio.kick(); this.audio.explosion();
      this.effects.zoomPulse(1.06);
      this.effects.floatingNumber(this.enemy.x, this.enemy.y - 150, 'THROWN!', '#ff9f5a', true);
    }
    else if (kind === 'kick' || kind === 'roundhouse') this.audio.kick();
    else if (kind === 'hook') { this.audio.punch(); this.audio.hit(); }
    else this.audio.punch();

    this.effects.spawnImpactSparks(strike.x, strike.y, '#ffdd55', kind === 'special' ? 26 : 14);
    this.effects.spawnSlash(strike.x, strike.y, Utils.rand(-0.4, 0.4), '#fff2b0');
    this.effects.shake(kind === 'special' ? 10 : 4, 0.18);
    this.effects.floatingNumber(this.enemy.x, this.enemy.y - 120, '-' + Math.round(damage), '#ffdd55');

    const dead = this.enemy.takeDamage(damage);
    if (dead) this.onEnemyDefeated();
  }

  levelUp() {
    this.level = Utils.clamp(this.level + 1, 1, 10);
    this.enemy.setLevel(this.level);
    this.bgIndex = (this.bgIndex + 1) % BACKGROUNDS.length;
    this.effects.comboText(this.viewW / 2, this.viewH * 0.25, `LEVEL ${this.level}!`, '#7fe6ff');
  }

  handleEnemyAttackLand(kind) {
    if (this.state !== 'playing' || this.practiceMode) return;
    if (!this.player || this.player.hp <= 0) return;
    const base = 5 + this.level * 1.1;
    const dmg = Utils.rand(base * 0.8, base * 1.2);
    const strike = this.enemy.getStrikePoint();
    this.audio.hit();
    this.effects.spawnImpactSparks(strike.x, strike.y, '#ff6b6b', 10);
    this.effects.shake(5, 0.15);
    this.effects.flashScreen('#ff3344', 0.18);
    this.effects.floatingNumber(this.player.x, this.player.y - 120, '-' + Math.round(dmg), '#ff6b6b');
    const dead = this.player.takeDamage(dmg);
    if (dead) this.onPlayerDefeated();
  }

  onEnemyDefeated() {
    if (this.state !== 'playing') return;
    this.state = 'victory';
    this.typing.stop();
    this.audio.stopMusic();
    this.enemy.clearQueue();
    this.enemy.playAction('death', 1.0);
    this.effects.zoomPulse(1.15);
    setTimeout(() => {
      this.player.clearQueue();
      this.player.playAction('victory', 2);
      this.audio.victory();
    }, 500);
    this.finishMatch('win');
  }

  onPlayerDefeated() {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    this.typing.stop();
    this.audio.stopMusic();
    this.player.clearQueue();
    this.player.playAction('death', 1.0);
    this.audio.defeat();
    this.finishMatch('loss');
  }

  finishMatch(result) {
    const p = this.player;
    const timeMs = Utils.now() - this.matchStart;
    const speedScore = Utils.clamp(p.avgWpm / 1.2, 0, 60);
    const composite = Utils.clamp(p.accuracy * 0.35 + speedScore * 0.5 + Math.min(p.maxCombo, 30) * 0.5, 0, 100);
    const grade = Utils.gradeFromScore(composite);

    this.lastMatchStats = {
      name: this.settings.playerName || 'Player',
      wpm: p.avgWpm, accuracy: p.accuracy, combo: p.maxCombo, wordsTyped: p.wordsTyped,
      mistakes: p.mistakes, damageDealt: Math.round(p.damageDealt), timeMs, result, grade,
      level: this.level
    };
    Storage.addScore(this.lastMatchStats);

    setTimeout(() => {
      if (result === 'win') {
        document.getElementById('victoryStatsPreview').textContent =
          `${p.avgWpm} WPM · ${Math.round(p.accuracy)}% accuracy · Grade ${grade}`;
        this.ui.showScreen('victoryScreen');
      } else {
        document.getElementById('gameOverStatsPreview').textContent =
          `${p.avgWpm} WPM · ${Math.round(p.accuracy)}% accuracy · Grade ${grade}`;
        this.ui.showScreen('gameOverScreen');
      }
    }, 1600);
  }

  showStats() {
    const s = this.lastMatchStats;
    if (!s) { this.quitToMenu(); return; }
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
      <div class="stat-card"><span>Words Typed</span><strong>${s.wordsTyped}</strong></div>
      <div class="stat-card"><span>Average WPM</span><strong>${s.wpm}</strong></div>
      <div class="stat-card"><span>Highest Combo</span><strong>x${s.combo}</strong></div>
      <div class="stat-card"><span>Accuracy</span><strong>${Math.round(s.accuracy)}%</strong></div>
      <div class="stat-card"><span>Time Played</span><strong>${Utils.formatTime(s.timeMs)}</strong></div>
      <div class="stat-card"><span>Damage Dealt</span><strong>${s.damageDealt}</strong></div>
      <div class="stat-card"><span>Mistakes</span><strong>${s.mistakes}</strong></div>
      <div class="stat-card grade-card grade-${s.grade}"><span>Grade</span><strong>${s.grade}</strong></div>
    `;
    this.ui.showScreen('statsScreen');
  }

  _loop(ts) {
    const dt = Math.min((ts - (this.lastTime || ts)) / 1000, 0.05);
    this.lastTime = ts;
    this.bgTime += dt;

    if (this.state === 'playing') {
      this.player.update(dt);
      this.enemy.update(dt, (kind) => this.handleEnemyAttackLand(kind));
      this.effects.update(dt);
      this.ui.updateHP(this.player, this.enemy);
      this.ui.updateStats(this.player, this.level);
      this.ui.renderWord(this.typing.getRenderState());
      this.ui.updateProgress(this.typing.progress);
    } else if (this.state === 'countdown' || this.state === 'victory' || this.state === 'gameover') {
      if (this.player) this.player.update(dt);
      if (this.enemy) this.enemy.update(dt, () => {});
      this.effects.update(dt);
      if (this.player && this.enemy) this.ui.updateHP(this.player, this.enemy);
    }

    this._render();
    requestAnimationFrame(this._loop);
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    this._drawBackground(ctx);

    ctx.save();
    const shake = this.effects.getShakeOffset();
    const zoom = this.effects.zoom;
    ctx.translate(this.viewW / 2, this.viewH / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-this.viewW / 2 + shake.x, -this.viewH / 2 + shake.y);

    if (this.enemy) this.enemy.draw(ctx);
    if (this.player) this.player.draw(ctx);
    this.effects.draw(ctx);
    ctx.restore();
  }

  _drawBackground(ctx) {
    const theme = BG_COLORS[BACKGROUNDS[this.bgIndex]];
    const w = this.viewW, h = this.viewH;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let layer = 0; layer < 3; layer++) {
      const speed = (layer + 1) * 4;
      const offset = (this.bgTime * speed) % w;
      ctx.globalAlpha = 0.15 + layer * 0.1;
      ctx.fillStyle = theme.accent;
      for (let i = -1; i < 3; i++) {
        const bx = i * (w / 2) - offset;
        const by = this.groundY - 20 - layer * 30;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + w / 4, by - 40 - layer * 20);
        ctx.lineTo(bx + w / 2, by);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, this.groundY + 10, w, h - this.groundY - 10);
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY + 10);
    ctx.lineTo(w, this.groundY + 10);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = theme.accent;
    for (let i = 0; i < 30; i++) {
      const x = (i * 137.5 + this.bgTime * 6) % w;
      const y = (i * 53.7) % (this.groundY - 10);
      const tw = (Math.sin(this.bgTime * 2 + i) + 1) / 2;
      ctx.globalAlpha = 0.1 + tw * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

window.addEventListener('DOMContentLoaded', () => { window.TypeFighterGame = new Game(); });