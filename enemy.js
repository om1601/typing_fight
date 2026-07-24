// enemy.js — the computer opponent. Attacks automatically on a timer that tightens with level.
class Enemy extends Stickman {
  constructor(x, y) {
    super(x, y, -1, '#ff4f5e');
    this.maxHP = 100;
    this.hp = 100;
    this.attackCooldown = 3.2;
    this.attackTimer = this.attackCooldown;
    this.telegraphing = false;
    this.telegraphTime = 0;
    this.level = 1;
  }

  setLevel(level) {
    this.level = level;
    this.attackCooldown = Utils.clamp(3.4 - level * 0.18, 1.1, 3.4);
  }

  update(dt, onAttackLand) {
    super.update(dt);
    if (this.hp <= 0) return;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0.5 && !this.telegraphing) {
      this.telegraphing = true;
    }
    if (this.attackTimer <= 0) {
      this.telegraphing = false;
      this.attackTimer = this.attackCooldown;
      const kind = Utils.choice(['jab', 'hook', 'punch', 'kick', 'uppercut']);
      const dur = { jab: 0.18, hook: 0.26, punch: 0.22, kick: 0.28, uppercut: 0.3 }[kind];
      this.playAction(kind, dur);
      setTimeout(() => { if (this.hp > 0) onAttackLand(kind); }, dur * 1000 * 0.55);
    }
  }

  interrupt() {
    if (this.action.name !== 'hit' && this.action.name !== 'death') {
      this.clearQueue();
      this.attackTimer = this.attackCooldown * 0.6;
    }
  }

  takeDamage(amount) {
    this.hp = Utils.clamp(this.hp - amount, 0, this.maxHP);
    this.triggerHit(1);
    this.interrupt();
    this.playAction('hit', 0.25);
    return this.hp <= 0;
  }
}