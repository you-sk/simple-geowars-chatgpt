import Vec2 from './Vec2.js';

/**
 * Powerup class for collectible power-ups
 */
class Powerup {
  constructor(pos, type, gameConfig) {
    this.pos = pos;
    this.type = type;
    this.r = 8;
    this.age = 0;
    this.lifetime = 10; // seconds before disappearing
    this.pulsePhase = Math.random() * Math.PI * 2;

    // Default config values if not provided
    const config = gameConfig || {
      powerupSpeed: 60
    };

    // Type-specific properties
    switch (type) {
    case 'triple':
      this.color = '#ff0';
      this.symbol = '3';
      break;
    case 'laser':
      this.color = '#f00';
      this.symbol = 'L';
      break;
    case 'shield':
      this.color = '#0ff';
      this.symbol = 'S';
      break;
    }

    // Gentle floating movement
    this.vel = new Vec2(
      (Math.random() - 0.5) * config.powerupSpeed,
      (Math.random() - 0.5) * config.powerupSpeed
    );
  }

  update(dt, canvas) {
    this.age += dt;
    this.pulsePhase += dt * 4;

    // Gentle floating
    this.pos = this.pos.add(this.vel.mul(dt));

    // Soft bouncing off screen edges
    if (canvas) {
      if (this.pos.x - this.r < 0 || this.pos.x + this.r > canvas.width) {
        this.vel.x *= -1;
      }
      if (this.pos.y - this.r < 0 || this.pos.y + this.r > canvas.height) {
        this.vel.y *= -1;
      }

      // Keep on screen
      this.pos.x = Math.max(this.r, Math.min(canvas.width - this.r, this.pos.x));
      this.pos.y = Math.max(this.r, Math.min(canvas.height - this.r, this.pos.y));
    }

    return this.age < this.lifetime;
  }

  draw(ctx) {
    const pulse = 0.7 + 0.3 * Math.sin(this.pulsePhase);
    const alpha = this.age > this.lifetime - 2 ? Math.max(0, (this.lifetime - this.age) / 2) : 1; // Fade out in last 2 seconds

    ctx.globalAlpha = alpha;

    // Outer glow ring
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = 20 * pulse;
    ctx.shadowColor = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r + 2 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
    ctx.fill();

    // Symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.symbol, this.pos.x, this.pos.y);

    ctx.globalAlpha = 1;
  }
}

export default Powerup;
