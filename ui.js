// ui.js — all DOM (non-canvas) UI: HUD numbers, bars, screen show/hide, word display
class UIManager {
  constructor() {
    this.el = {
      screens: document.querySelectorAll('.screen'),
      playerHP: document.getElementById('playerHPFill'),
      enemyHP: document.getElementById('enemyHPFill'),
      playerHPText: document.getElementById('playerHPText'),
      enemyHPText: document.getElementById('enemyHPText'),
      wpm: document.getElementById('statWPM'),
      accuracy: document.getElementById('statAccuracy'),
      combo: document.getElementById('statCombo'),
      level: document.getElementById('statLevel'),
      wordDisplay: document.getElementById('wordDisplay'),
      progressFill: document.getElementById('progressFill'),
      comboBanner: document.getElementById('comboBanner'),
      countdownEl: document.getElementById('countdownNum'),
    };
  }

  showScreen(id) {
    this.el.screens.forEach(s => s.classList.toggle('active', s.id === id));
  }

  updateHP(player, enemy) {
    const pPct = Utils.clamp((player.hp / player.maxHP) * 100, 0, 100);
    const ePct = Utils.clamp((enemy.hp / enemy.maxHP) * 100, 0, 100);
    this.el.playerHP.style.width = pPct + '%';
    this.el.enemyHP.style.width = ePct + '%';
    this.el.playerHPText.textContent = Math.ceil(player.hp);
    this.el.enemyHPText.textContent = Math.ceil(enemy.hp);
    this.el.playerHP.classList.toggle('low', pPct < 25);
    this.el.enemyHP.classList.toggle('low', ePct < 25);
  }

  updateStats(player, level) {
    this.el.wpm.textContent = player.avgWpm;
    this.el.accuracy.textContent = Math.round(player.accuracy) + '%';
    this.el.combo.textContent = 'x' + player.combo;
    this.el.level.textContent = level;
  }

  renderWord(renderState) {
    this.el.wordDisplay.innerHTML = renderState.map(c =>
      `<span class="ch ${c.state}">${c.char}</span>`
    ).join('');
  }

  updateProgress(pct) {
    this.el.progressFill.style.width = (pct * 100) + '%';
  }

  showComboBanner(text) {
    const banner = this.el.comboBanner;
    banner.textContent = text;
    banner.classList.remove('show');
    void banner.offsetWidth; // restart animation
    banner.classList.add('show');
  }

  setCountdown(text) {
    this.el.countdownEl.textContent = text;
  }
}
