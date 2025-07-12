// import Vec2 from './Vec2.js'; // Vec2 is used indirectly

/**
 * Particle class for visual effects
 */
class Particle {
  constructor(pos, vel, life, color, size = 2, type = 'circle') {
    this.pos = pos;
    this.vel = vel;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.type = type;
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.mul(dt));
    this.life -= dt;

    // Add some drag for more natural movement
    this.vel = this.vel.mul(0.98);
  }

  draw(ctx) {
    const alpha = Math.max(this.life / this.maxLife, 0);
    ctx.globalAlpha = alpha;

    if (this.type === 'spark') {
      // Bright spark effect
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Regular particle
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}

export default Particle;
