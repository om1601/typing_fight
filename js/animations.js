// animations.js — procedural, physics-flavored stickman renderer & animation state machine.
// No static images are used: every pose is generated each frame from joint angles.

const POSES = {
  idle: {
    head: [0, -78], neck: [0, -60], hip: [0, -20],
    lShoulder: [-14, -58], rShoulder: [14, -58],
    lElbow: [-20, -38], rElbow: [20, -38],
    lHand: [-16, -18], rHand: [16, -18],
    lKnee: [-10, 10], rKnee: [10, 10],
    lFoot: [-12, 40], rFoot: [12, 40],
    lean: 0
  },
  block: {
    head: [0, -76], neck: [0, -58], hip: [0, -20],
    lShoulder: [-14, -56], rShoulder: [14, -56],
    lElbow: [-6, -50], rElbow: [6, -50],
    lHand: [-2, -66], rHand: [2, -66],
    lKnee: [-12, 8], rKnee: [12, 8],
    lFoot: [-14, 40], rFoot: [14, 40],
    lean: 0.03
  }
};

class Stickman {
  constructor(x, y, facing, color) {
    this.x = x; this.y = y; this.facing = facing; this.color = color;
    this.action = { name: 'idle', t: 0, duration: 1 };
    this.queue = [];
    this.breathePhase = Math.random() * 10;
    this.hitFlash = 0;
    this.knockback = 0;
    this.dead = false;
    this.scale = 1;
  }

  playAction(name, duration) {
    this.queue.push({ name, t: 0, duration });
  }

  clearQueue() { this.queue = []; }

  triggerHit(power = 1) {
    this.hitFlash = 0.18;
    this.knockback = 10 * power * -this.facing;
  }

  update(dt) {
    this.breathePhase += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.knockback = Utils.lerp(this.knockback, 0, Math.min(1, dt * 6));
    this.action.t += dt;
    if (this.action.t >= this.action.duration) {
      if (this.queue.length) {
        this.action = this.queue.shift();
      } else if (this.action.name !== 'idle') {
        this.action = { name: 'idle', t: 0, duration: 1 };
      }
    }
  }

  getPose() {
    const a = this.action;
    const p = Utils.clamp(a.t / a.duration, 0, 1);
    switch (a.name) {
      case 'jab': return this.poseStrike(p, 'jab');
      case 'hook': return this.poseStrike(p, 'hook');
      case 'punch': return this.poseStrike(p, 'punch');
      case 'kick': return this.poseStrike(p, 'kick');
      case 'uppercut': return this.poseStrike(p, 'uppercut');
      case 'roundhouse': return this.poseStrike(p, 'roundhouse');
      case 'grapple': return this.poseStrike(p, 'grapple');
      case 'special': return this.poseStrike(p, 'special');
      case 'hit': return this.poseHitReaction(p);
      case 'block': return POSES.block;
      case 'victory': return this.poseVictory(p);
      case 'death': return this.poseDeath(p);
      default: return this.poseIdle();
    }
  }

  poseIdle() {
    const breathe = Math.sin(this.breathePhase * 2) * 2;
    return {
      head: [0, -78 + breathe * 0.3], neck: [0, -60 + breathe * 0.2], hip: [0, -20],
      lShoulder: [-14, -58 + breathe * 0.2], rShoulder: [14, -58 + breathe * 0.2],
      lElbow: [-20, -38], rElbow: [20, -38],
      lHand: [-16, -18 + breathe * 0.3], rHand: [16, -18 + breathe * 0.3],
      lKnee: [-10, 10], rKnee: [10, 10],
      lFoot: [-12, 40], rFoot: [12, 40],
      lean: Math.sin(this.breathePhase) * 0.015
    };
  }

  poseStrike(p, kind) {
    const e = Utils.easeOutCubic(p < 0.5 ? p * 2 : (1 - p) * 2);
    const wind = p < 0.15 ? -e * 0.4 : 0;
    const base = this.poseIdle();
    base.lunge = 0;

    if (kind === 'jab') {
      base.rShoulder = [14, -58];
      base.rElbow = [26 + e * 10, -48];
      base.rHand = [34 + e * 46, -48];
      base.lean = 0.14 * e;
      base.lunge = 26 * e;
    } else if (kind === 'hook') {
      base.rShoulder = [14, -56];
      base.rElbow = [30 + e * 22, -40 - e * 6];
      base.rHand = [26 + e * 40, -58 - e * 10];
      base.lHand = [-20 - e * 6, -30];
      base.lean = 0.22 * Math.sin(p * Math.PI);
      base.lunge = 20 * e;
    } else if (kind === 'punch') {
      base.rShoulder = [14, -58];
      base.rElbow = [24 + e * 8, -46];
      base.rHand = [30 + e * 44, -46 + Math.sin(p * Math.PI) * -4];
      base.lean = 0.12 * e;
      base.lunge = 20 * e;
    } else if (kind === 'kick') {
      base.rKnee = [20 + e * 20, 4 - e * 14];
      base.rFoot = [24 + e * 62, 6 - e * 8];
      base.lean = -0.18 * e;
      base.lunge = 24 * e;
    } else if (kind === 'uppercut') {
      base.rShoulder = [14, -58];
      base.rElbow = [22, -40 + e * 6];
      base.rHand = [24 + e * 20, -20 - e * 54];
      base.lean = 0.1 * e;
      base.lunge = 22 * e;
    } else if (kind === 'roundhouse') {
      base.rKnee = [10 - e * 24, 6 - e * 20];
      base.rFoot = [10 + e * 64, 8 - e * 4];
      base.lHand = [-22 - e * 6, -30];
      base.lean = 0.28 * Math.sin(p * Math.PI);
      base.lunge = 30 * e;
    } else if (kind === 'grapple') {
      const grab = p < 0.5 ? Utils.easeOutCubic(p * 2) : 1;
      const throwPhase = p > 0.55 ? Utils.easeOutCubic((p - 0.55) / 0.45) : 0;
      base.rShoulder = [14, -56]; base.lShoulder = [-14, -56];
      base.rElbow = [24 + grab * 18, -46]; base.lElbow = [-24 - grab * 18, -46];
      base.rHand = [30 + grab * 50 - throwPhase * 20, -46]; base.lHand = [-30 - grab * 50 + throwPhase * 20, -46];
      base.lean = 0.1 * grab - 0.3 * throwPhase;
      base.lunge = 46 * grab - 30 * throwPhase;
    } else if (kind === 'special') {
      const glow = Math.sin(p * Math.PI);
      base.rShoulder = [14, -58]; base.lShoulder = [-14, -58];
      base.rElbow = [26, -46]; base.lElbow = [-26, -46];
      base.rHand = [34 + e * 40, -46]; base.lHand = [-34 - e * 10, -46];
      base.rKnee = [12, 6 - glow * 6]; base.lKnee = [-12, 6 - glow * 6];
      base.lean = 0.15 * glow;
      base.glow = glow;
      base.lunge = 34 * e;
    }
    base.lean += wind;
    return base;
  }

  poseHitReaction(p) {
    const e = 1 - Utils.easeOutCubic(p);
    const base = this.poseIdle();
    base.lean = -0.25 * e * this.facing * -1;
    base.head = [base.head[0] + 6 * e * -this.facing, base.head[1] + 4 * e];
    base.hip = [base.hip[0] - 4 * e * this.facing, base.hip[1]];
    return base;
  }

  poseVictory(p) {
    const bounce = Math.abs(Math.sin(p * Math.PI * 4)) * 8;
    const base = this.poseIdle();
    base.lShoulder = [-16, -60]; base.rShoulder = [16, -60];
    base.lElbow = [-24, -78]; base.rElbow = [24, -78];
    base.lHand = [-20, -96 - bounce]; base.rHand = [20, -96 - bounce];
    base.hip = [0, -20 - bounce * 0.5];
    return base;
  }

  poseDeath(p) {
    const e = Utils.easeOutCubic(p);
    const base = this.poseIdle();
    base.lean = 0.5 * this.facing * -1 * e;
    base.head = [base.head[0], base.head[1] + 30 * e];
    base.hip = [0, -20 + 24 * e];
    base.lKnee = [base.lKnee[0], base.lKnee[1] - 6 * e];
    base.rKnee = [base.rKnee[0], base.rKnee[1] - 6 * e];
    return base;
  }

  draw(ctx) {
    if (this.hitFlash > 0 && Math.floor(this.hitFlash * 40) % 2 === 0) {
      ctx.save();
      ctx.filter = 'brightness(2) saturate(0)';
    }
    const pose = this.getPose();
    const ox = this.x + this.knockback + (pose.lunge || 0) * this.facing;
    const oy = this.y;
    const f = this.facing;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(f * this.scale, this.scale);
    ctx.rotate(pose.lean || 0);

    if (pose.glow) {
      ctx.save();
      const g = ctx.createRadialGradient(0, -40, 5, 0, -40, 70 + pose.glow * 30);
      g.addColorStop(0, this.color + 'aa');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -40, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 10;

    const hip = pose.hip;
    ctx.save();
    ctx.strokeStyle = 'rgba(5,2,15,0.85)';
    ctx.lineWidth = 10;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(hip[0], hip[1]);
    ctx.lineTo(pose.neck[0], pose.neck[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pose.head[0], pose.head[1] - 8, 16, 0, Math.PI * 2);
    ctx.stroke();
    this.limbOutline(ctx, pose.neck, pose.lShoulder, pose.lElbow, pose.lHand);
    this.limbOutline(ctx, pose.neck, pose.rShoulder, pose.rElbow, pose.rHand);
    this.limbOutline(ctx, hip, [hip[0] - 6, hip[1] + 4], pose.lKnee, pose.lFoot);
    this.limbOutline(ctx, hip, [hip[0] + 6, hip[1] + 4], pose.rKnee, pose.rFoot);
    ctx.restore();

    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hip[0], hip[1]);
    ctx.lineTo(pose.neck[0], pose.neck[1]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pose.head[0], pose.head[1] - 8, 14, 0, Math.PI * 2);
    ctx.fill();

    this.limb(ctx, pose.neck, pose.lShoulder, pose.lElbow, pose.lHand, 5);
    this.limb(ctx, pose.neck, pose.rShoulder, pose.rElbow, pose.rHand, 5);

    this.limb(ctx, hip, [hip[0] - 6, hip[1] + 4], pose.lKnee, pose.lFoot, 6);
    this.limb(ctx, hip, [hip[0] + 6, hip[1] + 4], pose.rKnee, pose.rFoot, 6);

    ctx.restore();
    if (this.hitFlash > 0 && Math.floor(this.hitFlash * 40) % 2 === 0) ctx.restore();
  }

  limbOutline(ctx, from, shoulder, mid, end) {
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(shoulder[0], shoulder[1]);
    ctx.lineTo(mid[0], mid[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
  }

  limb(ctx, from, shoulder, mid, end, width) {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(shoulder[0], shoulder[1]);
    ctx.lineTo(mid[0], mid[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mid[0], mid[1], width * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  getStrikePoint() {
    const pose = this.getPose();
    const kickMoves = ['kick', 'roundhouse'];
    const pick = kickMoves.includes(this.action.name) ? pose.rFoot : pose.rHand;
    const lungeOffset = (pose.lunge || 0) * this.facing;
    return { x: this.x + this.knockback + lungeOffset + pick[0] * this.facing, y: this.y + pick[1] };
  }
}