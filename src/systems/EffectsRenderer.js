/**
 * EffectsRenderer handles all visual effects including:
 * - Particle systems (sparks, explosions, debris)
 * - Trail rendering for moving objects
 * - Bomb effects and other special effects
 */
class EffectsRenderer {
  constructor(config = {}) {
    this.config = {
      defaultParticleSize: 2,
      sparkSize: 3,
      sparkSizeVariation: 2,
      sparkLifetimeMultiplier: 1.5,
      trailAlphaMultiplier: 0.7,
      dragFactor: 0.98,
      ...config
    };
  }

  /**
   * Render all effects
   */
  render(ctx, effects, deltaTime) {
    // Update and render particles
    if (effects.particles) {
      this.renderParticles(ctx, effects.particles, deltaTime);
    }

    // Render trails for entities that have them
    if (effects.trails) {
      this.renderTrails(ctx, effects.trails);
    }

    // Render bomb effects
    if (effects.bombEffect) {
      this.renderBombEffect(ctx, effects.bombEffect);
    }
  }

  /**
   * Render particle systems
   */
  renderParticles(ctx, particles, _deltaTime) {
    particles.forEach(particle => {
      this.renderParticle(ctx, particle);
    });
  }

  /**
   * Render a single particle
   */
  renderParticle(ctx, particle) {
    const alpha = Math.max(particle.life / particle.maxLife, 0);
    ctx.globalAlpha = alpha;

    if (particle.type === 'spark') {
      // Bright spark effect
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;
      ctx.beginPath();
      ctx.arc(particle.pos.x, particle.pos.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Regular particle
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.pos.x, particle.pos.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Render trails for moving objects
   */
  renderTrails(ctx, trails) {
    if (!Array.isArray(trails)) {
      this.renderTrail(ctx, trails);
      return;
    }

    trails.forEach(trail => {
      this.renderTrail(ctx, trail);
    });
  }

  /**
   * Render a single trail
   */
  renderTrail(ctx, trail) {
    if (!trail || !trail.points || trail.points.length < 2) {return;}

    const { points, color = '#fff', width = 2 } = trail;

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
      const alpha = (i / points.length) * this.config.trailAlphaMultiplier;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width * alpha;

      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Render bomb effect
   */
  renderBombEffect(ctx, bombEffect) {
    if (!bombEffect || !bombEffect.waves) {return;}

    const center = bombEffect.center || { x: 0, y: 0 };

    // Draw multiple expanding rings
    for (let i = 0; i < bombEffect.waves.length; i++) {
      const wave = bombEffect.waves[i];
      const waveAge = bombEffect.age - wave.delay;

      if (waveAge > 0) {
        const waveProgress = Math.min(waveAge / bombEffect.duration, 1);
        const waveRadius = bombEffect.maxRadius * Math.pow(waveProgress, 0.5);
        const alpha = 1 - waveProgress;

        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
        ctx.shadowBlur = 20 * alpha;
        ctx.shadowColor = '#ff0';
        ctx.lineWidth = 8 * alpha;
        ctx.beginPath();
        ctx.arc(center.x, center.y, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Draw filled blast area
    const alpha = Math.max(0, 1 - bombEffect.age / bombEffect.duration);
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.1})`;
    ctx.beginPath();
    ctx.arc(center.x, center.y, bombEffect.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Create a particle burst effect
   */
  createBurst(pos, color, count = 16, type = 'circle', config = {}) {
    const particles = [];
    const burstConfig = {
      minSpeed: 50,
      maxSpeed: 150,
      lifetime: 0.6,
      ...config
    };

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed =
        burstConfig.minSpeed + Math.random() * (burstConfig.maxSpeed - burstConfig.minSpeed);
      const vel = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      const size =
        type === 'spark'
          ? this.config.sparkSize + Math.random() * this.config.sparkSizeVariation
          : this.config.defaultParticleSize;
      const life =
        type === 'spark'
          ? burstConfig.lifetime * this.config.sparkLifetimeMultiplier
          : burstConfig.lifetime;

      particles.push({
        pos: { x: pos.x, y: pos.y },
        vel: vel,
        life: life,
        maxLife: life,
        color: color,
        size: size,
        type: type
      });
    }

    return particles;
  }

  /**
   * Create an explosion effect
   */
  createExplosion(pos, color, size = 'normal') {
    const particles = [];
    const count = size === 'large' ? 32 : 16;
    const sparkCount = size === 'large' ? 8 : 4;

    // Regular particles
    particles.push(...this.createBurst(pos, color, count, 'circle'));

    // Bright sparks
    particles.push(...this.createBurst(pos, color, sparkCount, 'spark'));

    return particles;
  }

  /**
   * Update particle physics
   */
  updateParticle(particle, deltaTime) {
    // Update position
    particle.pos.x += particle.vel.x * deltaTime;
    particle.pos.y += particle.vel.y * deltaTime;

    // Update life
    particle.life -= deltaTime;

    // Add some drag for more natural movement
    particle.vel.x *= this.config.dragFactor;
    particle.vel.y *= this.config.dragFactor;

    return particle.life > 0;
  }

  /**
   * Create a trail object
   */
  createTrail(maxLength = 20) {
    return {
      points: [],
      maxLength: maxLength,
      addPoint: function (pos) {
        this.points.push({ x: pos.x, y: pos.y, time: Date.now() });
        if (this.points.length > this.maxLength) {
          this.points.shift();
        }
      },
      clear: function () {
        this.points = [];
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Handle resize events
   */
  resize() {
    // Effects renderer doesn't need special resize handling
  }
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EffectsRenderer;
}
