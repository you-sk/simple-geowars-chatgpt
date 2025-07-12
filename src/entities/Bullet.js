// import Vec2 from './Vec2.js'; // Vec2 is used implicitly in the constructors

/**
 * Trail class for visual effects on moving objects
 */
class Trail {
  constructor(maxLength = 20) {
    this.points = [];
    this.maxLength = maxLength;
  }

  addPoint(pos) {
    this.points.push({ x: pos.x, y: pos.y, time: Date.now() });
    if (this.points.length > this.maxLength) {
      this.points.shift();
    }
  }

  draw(ctx, color = '#fff', width = 2) {
    if (this.points.length < 2) {return;}

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < this.points.length; i++) {
      const alpha = i / this.points.length;
      ctx.globalAlpha = alpha * 0.7;
      ctx.lineWidth = width * alpha;

      ctx.beginPath();
      ctx.moveTo(this.points[i - 1].x, this.points[i - 1].y);
      ctx.lineTo(this.points[i].x, this.points[i].y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  clear() {
    this.points = [];
  }
}

/**
 * Bullet class for player projectiles
 */
class Bullet {
  constructor(pos, vel, gameConfig) {
    this.pos = pos;
    this.vel = vel;
    this.r = gameConfig ? gameConfig.bulletRadius : 4;
    this.trail = new Trail(15);
    this.piercing = false;
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.mul(dt));
    this.trail.addPoint(this.pos);
  }

  draw(ctx, _canvas) {
    // Draw trail first
    this.trail.draw(ctx, '#88f', 3);

    // Draw bullet with glow effect
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#88f';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  offScreen(canvas) {
    return (
      this.pos.x < -10 ||
      this.pos.x > canvas.width + 10 ||
      this.pos.y < -10 ||
      this.pos.y > canvas.height + 10
    );
  }
}

/**
 * LaserBullet class for piercing laser shots
 */
class LaserBullet extends Bullet {
  constructor(pos, vel, gameConfig) {
    super(pos, vel, gameConfig);
    this.piercing = true;
    this.r = gameConfig ? gameConfig.bulletRadius * 1.2 : 4.8;
    this.trail = new Trail(20);
    this.hitCount = 0;
    this.maxHits = 3;
  }

  draw(ctx, _canvas) {
    // Draw longer, brighter trail
    this.trail.draw(ctx, '#f44', 4);

    // Draw laser bullet with red glow
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#f44';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
    ctx.fill();

    // Inner red core
    ctx.fillStyle = '#f44';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  hit() {
    this.hitCount++;
    return this.hitCount >= this.maxHits;
  }
}

export { Bullet, LaserBullet, Trail };
