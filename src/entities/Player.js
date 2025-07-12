import Vec2 from './Vec2.js';
import { Bullet, LaserBullet, Trail } from './Bullet.js';
import Particle from './Particle.js';

/**
 * Player class for the main character
 */
class Player {
  constructor(canvas, gameConfig) {
    this.canvas = canvas;
    this.gameConfig = gameConfig || {
      playerSpeed: 250,
      playerRadius: 10,
      fireRate: 0.15,
      bulletSpeed: 450,
      invulnerabilityTime: 1.5,
      powerupDuration: 15
    };

    this.pos = new Vec2(canvas ? canvas.width / 2 : 400, canvas ? canvas.height / 2 : 300);
    this.speed = this.gameConfig.playerSpeed;
    this.r = this.gameConfig.playerRadius;
    this.fireRate = this.gameConfig.fireRate;
    this.cd = 0;
    this.invulnerable = 0;
    this.trail = new Trail(12);
    this.thrustPhase = 0;

    // Powerup system
    this.powerups = {
      triple: 0,
      laser: 0,
      shield: 0
    };
    this.shieldHealth = 0;
  }

  update(dt, keys, gamepad, canvas, bullets, particles, audioSystem) {
    // Update canvas reference if provided
    if (canvas) {this.canvas = canvas;}

    // Movement
    let dir = new Vec2(0, 0);

    // Keyboard movement WASD
    if (keys && keys['KeyW']) {dir = dir.add(new Vec2(0, -1));}
    if (keys && keys['KeyS']) {dir = dir.add(new Vec2(0, 1));}
    if (keys && keys['KeyA']) {dir = dir.add(new Vec2(-1, 0));}
    if (keys && keys['KeyD']) {dir = dir.add(new Vec2(1, 0));}

    // Gamepad left stick
    if (gamepad) {
      const ax = gamepad.axes[0],
        ay = gamepad.axes[1];
      if (Math.hypot(ax, ay) > 0.2) {dir = dir.add(new Vec2(ax, ay));}
    }

    const isMoving = dir.x || dir.y;
    if (isMoving) {
      this.pos = this.pos.add(dir.norm().mul(this.speed * dt));
      this.trail.addPoint(this.pos);
      this.thrustPhase += dt * 15;

      // Add thrust particles
      if (particles && Math.random() < 0.3) {
        const thrustDir = dir.norm().mul(-1);
        const spread = 0.5;
        const thrustVel = thrustDir
          .add(new Vec2((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread))
          .mul(80);

        particles.push(
          new Particle(this.pos.add(thrustDir.mul(this.r + 2)), thrustVel, 0.3, '#0a0', 1)
        );
      }
    }

    // Keep player on screen
    if (this.canvas) {
      this.pos.x = Math.max(this.r, Math.min(this.canvas.width - this.r, this.pos.x));
      this.pos.y = Math.max(this.r, Math.min(this.canvas.height - this.r, this.pos.y));
    }

    // Shooting
    if (this.cd > 0) {this.cd -= dt;}

    let sdir = new Vec2(0, 0);
    // Keyboard arrows
    if (keys && keys['ArrowUp']) {sdir = sdir.add(new Vec2(0, -1));}
    if (keys && keys['ArrowDown']) {sdir = sdir.add(new Vec2(0, 1));}
    if (keys && keys['ArrowLeft']) {sdir = sdir.add(new Vec2(-1, 0));}
    if (keys && keys['ArrowRight']) {sdir = sdir.add(new Vec2(1, 0));}

    // Gamepad right stick (axes 2,3)
    if (gamepad) {
      const ax = gamepad.axes[2],
        ay = gamepad.axes[3];
      if (Math.hypot(ax, ay) > 0.25) {sdir = sdir.add(new Vec2(ax, ay));}
    }

    if ((sdir.x || sdir.y) && this.cd <= 0 && bullets) {
      const shotDir = sdir.norm();
      const shotOrigin = this.pos.add(shotDir.mul(this.r + 4));

      if (this.powerups.triple > 0) {
        // Triple shot
        const spread = Math.PI / 8; // 22.5 degrees
        for (let i = -1; i <= 1; i++) {
          const angle = Math.atan2(shotDir.y, shotDir.x) + i * spread;
          const bulletDir = new Vec2(Math.cos(angle), Math.sin(angle));
          bullets.push(
            new Bullet(shotOrigin, bulletDir.mul(this.gameConfig.bulletSpeed), this.gameConfig)
          );
        }
      } else if (this.powerups.laser > 0) {
        // Laser shot (faster, piercing bullets)
        bullets.push(
          new LaserBullet(
            shotOrigin,
            shotDir.mul(this.gameConfig.bulletSpeed * 1.5),
            this.gameConfig
          )
        );
      } else {
        // Normal shot
        bullets.push(
          new Bullet(shotOrigin, shotDir.mul(this.gameConfig.bulletSpeed), this.gameConfig)
        );
      }

      this.cd = this.fireRate;

      // Muzzle flash effect
      if (particles) {
        this.spawnBurst(shotOrigin, '#88f', 4, 'spark', particles);
      }

      // Play shoot sound
      if (audioSystem && audioSystem.playSound) {
        audioSystem.playSound('shoot', 0.3);
      }
    }

    // Update powerup timers
    Object.keys(this.powerups).forEach(key => {
      if (this.powerups[key] > 0) {
        this.powerups[key] -= dt;
        if (this.powerups[key] <= 0) {
          this.powerups[key] = 0;
        }
      }
    });

    // Update invulnerability
    if (this.invulnerable > 0) {
      this.invulnerable -= dt;
    }
  }

  draw(ctx) {
    // Draw movement trail
    if (this.trail.points.length > 0) {
      this.trail.draw(ctx, '#0a0', 2);
    }

    // Flash when invulnerable
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 === 0) {
      ctx.fillStyle = '#0f0';
      ctx.globalAlpha = 0.5;
    } else {
      ctx.fillStyle = '#0f0';
      ctx.globalAlpha = 1;
    }

    // Player with glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0f0';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw shield if active
    if (this.shieldHealth > 0) {
      const shieldPulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.01);
      ctx.strokeStyle = '#0ff';
      ctx.shadowBlur = 15 * shieldPulse;
      ctx.shadowColor = '#0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  }

  hit() {
    if (this.invulnerable <= 0) {
      // Check shield first
      if (this.shieldHealth > 0) {
        this.shieldHealth--;
        this.invulnerable = this.gameConfig.invulnerabilityTime * 0.5; // Shorter invulnerability with shield
        return false; // Shield absorbed the hit
      }

      this.invulnerable = this.gameConfig.invulnerabilityTime;
      return true;
    }
    return false;
  }

  addPowerup(type) {
    switch (type) {
    case 'triple':
      this.powerups.triple = this.gameConfig.powerupDuration;
      break;
    case 'laser':
      this.powerups.laser = this.gameConfig.powerupDuration;
      break;
    case 'shield':
      this.powerups.shield = this.gameConfig.powerupDuration;
      this.shieldHealth = 3; // Shield can absorb 3 hits
      break;
    }
  }

  // Helper method for particle effects
  spawnBurst(pos, color, count, type, particles) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const v = new Vec2(Math.cos(angle), Math.sin(angle)).mul(speed);
      const size = type === 'spark' ? 3 + Math.random() * 2 : 2;
      const life = type === 'spark' ? 0.9 : 0.6;
      particles.push(new Particle(pos, v, life, color, size, type));
    }
  }
}

export default Player;
