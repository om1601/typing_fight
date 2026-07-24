// effects.js — particle system, screen shake, floating damage/combo text, flashes
class EffectsSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.flash = null; // {color, alpha}
    this.zoom = 1;
    this.zoomTarget = 1;
  }

  shake(magnitude, duration) {
    this.shakeMag = Math.max(this.shakeMag, magnitude);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  zoomPulse(amount) {
    this.zoomTarget = amount;
    setTimeout(() => { this.zoomTarget = 1; }, 220);
  }

  flashScreen(color = '#ffffff', alpha = 0.35) {
    this.flash = { color, alpha };
  }

  spawnImpactSparks(x, y, color = '#ffdd55', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Utils.rand(0, Math.PI * 2);
      const speed = Utils.rand(2, 7);
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: Utils.rand(0.25, 0.5), age: 0, size: Utils.rand(2, 5), color, type: 'spark'
      });
    }
  }

  spawnDust(x, y, dir = 1) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + Utils.rand(-8, 8), y: y + Utils.rand(-4, 4),
        vx: -dir * Utils.rand(1, 3), vy: Utils.rand(-1, -0.2),
        life: Utils.rand(0.4, 0.7), age: 0, size: Utils.rand(4, 9),
        color: 'rgba(180,170,160,0.5)', type: 'dust'
      });
    }
  }

  spawnSlash(x, y, angle, color) {
    this.particles.push({ x, y, angle, life: 0.18, age: 0, size: 60, color, type: 'slash' });
  }

  spawnSpeedTrail(x, y, color) {
    this.particles.push({ x, y, life: 0.25, age: 0, size: Utils.rand(6, 12), color, type: 'trail', vx: 0, vy: 0 });
  }

  floatingNumber(x, y, text, color = '#fff', big = false) {
    this.floatingTexts.push({
      x, y, text, color, age: 0, life: 1.1, big,
      vy: -Utils.rand(40, 60), vx: Utils.rand(-10, 10)
    });
  }

  comboText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, age: 0, life: 1.0, big: true, vy: -30, vx: 0, combo: true });
  }

  update(dt) {
    this.particles.forEach(p => {
      p.age += dt;
      p.x += (p.vx || 0) * dt * 60;
      p.y += (p.vy || 0) * dt * 60;
      if (p.type === 'dust') p.vy += dt * 0.5;
      if (p.type === 'spark') p.vy += dt * 6;
    });
    this.particles = this.particles.filter(p => p.age < p.life);

    this.floatingTexts.forEach(t => {
      t.age += dt;
      t.y += t.vy * dt;
      t.x += t.vx * dt;
      t.vy += dt * 30;
    });
    this.floatingTexts = this.floatingTexts.filter(t => t.age < t.life);

    if (this.shakeTime > 0) this.shakeTime -= dt;
    else this.shakeMag = 0;

    this.zoom = Utils.lerp(this.zoom, this.zoomTarget, 0.2);

    if (this.flash) {
      this.flash.alpha -= dt * 2.5;
      if (this.flash.alpha <= 0) this.flash = null;
    }
  }

  getShakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    return { x: Utils.rand(-this.shakeMag, this.shakeMag), y: Utils.rand(-this.shakeMag, this.shakeMag) };
  }

  draw(ctx) {
    // particles
    this.particles.forEach(p => {
      const t = p.age / p.life;
      ctx.save();
      ctx.globalAlpha = Utils.clamp(1 - t, 0, 1);
      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'slash') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        const grad = ctx.createLinearGradient(-p.size / 2, 0, p.size / 2, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 6 * (1 - t);
        ctx.beginPath();
        ctx.moveTo(-p.size / 2, 0);
        ctx.lineTo(p.size / 2, 0);
        ctx.stroke();
      } else if (p.type === 'trail') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // floating texts
    this.floatingTexts.forEach(t => {
      const tt = t.age / t.life;
      ctx.save();
      ctx.globalAlpha = Utils.clamp(1 - tt, 0, 1);
      ctx.textAlign = 'center';
      ctx.font = t.big ? `bold ${28 + (t.combo ? 6 : 0)}px 'Rajdhani', sans-serif` : `bold 20px 'Rajdhani', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    // flash
    if (this.flash) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.flash.alpha);
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }
}
