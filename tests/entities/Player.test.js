import Player from '../../src/entities/Player.js';
import Vec2 from '../../src/entities/Vec2.js';
import { Bullet, LaserBullet } from '../../src/entities/Bullet.js';
import Particle from '../../src/entities/Particle.js';

describe('Player', () => {
  let player;
  let mockCanvas;
  let mockGameConfig;
  let mockCtx;

  beforeEach(() => {
    mockCanvas = {
      width: 800,
      height: 600
    };
    
    mockGameConfig = {
      playerSpeed: 250,
      playerRadius: 10,
      fireRate: 0.15,
      bulletSpeed: 450,
      bulletRadius: 4,
      invulnerabilityTime: 1.5,
      powerupDuration: 15
    };

    mockCtx = {
      fillStyle: '#000',
      strokeStyle: '#000',
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: '#000',
      lineWidth: 1,
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn()
    };

    player = new Player(mockCanvas, mockGameConfig);
  });

  describe('constructor', () => {
    it('should initialize player with correct position', () => {
      expect(player.pos.x).toBe(400);
      expect(player.pos.y).toBe(300);
    });

    it('should initialize player properties correctly', () => {
      expect(player.speed).toBe(250);
      expect(player.r).toBe(10);
      expect(player.fireRate).toBe(0.15);
      expect(player.cd).toBe(0);
      expect(player.invulnerable).toBe(0);
    });

    it('should initialize powerup system', () => {
      expect(player.powerups.triple).toBe(0);
      expect(player.powerups.laser).toBe(0);
      expect(player.powerups.shield).toBe(0);
      expect(player.shieldHealth).toBe(0);
    });

    it('should handle missing canvas', () => {
      const playerNoCanvas = new Player(null, mockGameConfig);
      expect(playerNoCanvas.pos.x).toBe(400);
      expect(playerNoCanvas.pos.y).toBe(300);
    });

    it('should use default config if not provided', () => {
      const playerNoConfig = new Player(mockCanvas);
      expect(playerNoConfig.speed).toBe(250);
      expect(playerNoConfig.r).toBe(10);
    });
  });

  describe('update - movement', () => {
    it('should move player with WASD keys', () => {
      const keys = { 'KeyW': true };
      const dt = 0.016; // 16ms
      const initialY = player.pos.y;
      
      player.update(dt, keys, null, mockCanvas, [], []);
      
      expect(player.pos.y).toBeLessThan(initialY);
    });

    it('should handle diagonal movement', () => {
      const keys = { 'KeyW': true, 'KeyD': true };
      const dt = 0.016;
      const initialPos = { x: player.pos.x, y: player.pos.y };
      
      player.update(dt, keys, null, mockCanvas, [], []);
      
      expect(player.pos.x).toBeGreaterThan(initialPos.x);
      expect(player.pos.y).toBeLessThan(initialPos.y);
    });

    it('should normalize diagonal movement speed', () => {
      const keys = { 'KeyW': true, 'KeyD': true };
      const dt = 0.016;
      const initialPos = { x: player.pos.x, y: player.pos.y };
      
      player.update(dt, keys, null, mockCanvas, [], []);
      
      const deltaX = player.pos.x - initialPos.x;
      const deltaY = initialPos.y - player.pos.y;
      const moveDistance = Math.hypot(deltaX, deltaY);
      const expectedDistance = player.speed * dt;
      
      expect(moveDistance).toBeCloseTo(expectedDistance, 1);
    });

    it('should respect screen boundaries', () => {
      player.pos.x = 5;
      player.pos.y = 5;
      
      const keys = { 'KeyA': true, 'KeyW': true };
      player.update(0.016, keys, null, mockCanvas, [], []);
      
      expect(player.pos.x).toBeGreaterThanOrEqual(player.r);
      expect(player.pos.y).toBeGreaterThanOrEqual(player.r);
    });

    it('should handle gamepad movement', () => {
      const gamepad = {
        axes: [0.5, 0.5, 0, 0], // Left stick right-down
        buttons: []
      };
      const initialPos = { x: player.pos.x, y: player.pos.y };
      
      player.update(0.016, {}, gamepad, mockCanvas, [], []);
      
      expect(player.pos.x).toBeGreaterThan(initialPos.x);
      expect(player.pos.y).toBeGreaterThan(initialPos.y);
    });

    it('should ignore gamepad deadzone', () => {
      const gamepad = {
        axes: [0.1, 0.1, 0, 0], // Below deadzone
        buttons: []
      };
      const initialPos = { x: player.pos.x, y: player.pos.y };
      
      player.update(0.016, {}, gamepad, mockCanvas, [], []);
      
      expect(player.pos.x).toBe(initialPos.x);
      expect(player.pos.y).toBe(initialPos.y);
    });

    it('should add thrust particles when moving', () => {
      const particles = [];
      const keys = { 'KeyW': true };
      
      // Run multiple updates to ensure particle spawn chance triggers
      for (let i = 0; i < 10; i++) {
        player.update(0.016, keys, null, mockCanvas, [], particles);
      }
      
      expect(particles.length).toBeGreaterThan(0);
      expect(particles[0]).toBeInstanceOf(Particle);
    });
  });

  describe('update - shooting', () => {
    it('should shoot bullets with arrow keys', () => {
      const bullets = [];
      const keys = { 'ArrowUp': true };
      player.cd = 0;
      
      player.update(0.016, keys, null, mockCanvas, bullets, []);
      
      expect(bullets.length).toBe(1);
      expect(bullets[0]).toBeInstanceOf(Bullet);
      expect(bullets[0].vel.y).toBeLessThan(0); // Moving up
    });

    it('should respect fire rate cooldown', () => {
      const bullets = [];
      const keys = { 'ArrowUp': true };
      player.cd = 0;
      
      player.update(0.016, keys, null, mockCanvas, bullets, []);
      expect(bullets.length).toBe(1);
      
      // Try to shoot again immediately
      player.update(0.016, keys, null, mockCanvas, bullets, []);
      expect(bullets.length).toBe(1); // Still 1 bullet
    });

    it('should shoot with gamepad', () => {
      const bullets = [];
      const gamepad = {
        axes: [0, 0, 1, 0], // Right stick right
        buttons: []
      };
      player.cd = 0;
      
      player.update(0.016, {}, gamepad, mockCanvas, bullets, []);
      
      expect(bullets.length).toBe(1);
      expect(bullets[0].vel.x).toBeGreaterThan(0); // Moving right
    });

    it('should shoot triple bullets with triple powerup', () => {
      const bullets = [];
      const keys = { 'ArrowUp': true };
      player.cd = 0;
      player.powerups.triple = 5; // 5 seconds remaining
      
      player.update(0.016, keys, null, mockCanvas, bullets, []);
      
      expect(bullets.length).toBe(3);
      bullets.forEach(bullet => expect(bullet).toBeInstanceOf(Bullet));
    });

    it('should shoot laser bullets with laser powerup', () => {
      const bullets = [];
      const keys = { 'ArrowUp': true };
      player.cd = 0;
      player.powerups.laser = 5;
      
      player.update(0.016, keys, null, mockCanvas, bullets, []);
      
      expect(bullets.length).toBe(1);
      expect(bullets[0]).toBeInstanceOf(LaserBullet);
      expect(bullets[0].piercing).toBe(true);
    });

    it('should spawn muzzle flash particles when shooting', () => {
      const bullets = [];
      const particles = [];
      const keys = { 'ArrowUp': true };
      player.cd = 0;
      
      player.update(0.016, keys, null, mockCanvas, bullets, particles);
      
      expect(particles.length).toBeGreaterThan(0);
    });

    it('should handle diagonal shooting', () => {
      const bullets = [];
      const keys = { 'ArrowUp': true, 'ArrowRight': true };
      player.cd = 0;
      
      player.update(0.016, keys, null, mockCanvas, bullets, []);
      
      expect(bullets.length).toBe(1);
      expect(bullets[0].vel.x).toBeGreaterThan(0);
      expect(bullets[0].vel.y).toBeLessThan(0);
    });
  });

  describe('update - powerups', () => {
    it('should decrease powerup timers', () => {
      player.powerups.triple = 1;
      player.powerups.laser = 2;
      player.powerups.shield = 3;
      
      player.update(0.5, {}, null, mockCanvas, [], []);
      
      expect(player.powerups.triple).toBe(0.5);
      expect(player.powerups.laser).toBe(1.5);
      expect(player.powerups.shield).toBe(2.5);
    });

    it('should reset powerup to 0 when expired', () => {
      player.powerups.triple = 0.01;
      
      player.update(0.02, {}, null, mockCanvas, [], []);
      
      expect(player.powerups.triple).toBe(0);
    });
  });

  describe('update - invulnerability', () => {
    it('should decrease invulnerability timer', () => {
      player.invulnerable = 1;
      
      player.update(0.5, {}, null, mockCanvas, [], []);
      
      expect(player.invulnerable).toBe(0.5);
    });
  });

  describe('draw', () => {
    it('should draw player normally', () => {
      player.draw(mockCtx);
      
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalledWith(
        player.pos.x,
        player.pos.y,
        player.r,
        0,
        Math.PI * 2
      );
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should flash when invulnerable', () => {
      player.invulnerable = 0.5;
      
      player.draw(mockCtx);
      
      // Should have modified alpha or style for flashing effect
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should draw shield when shield health > 0', () => {
      player.shieldHealth = 3;
      
      player.draw(mockCtx);
      
      // Should draw both player and shield
      expect(mockCtx.arc).toHaveBeenCalledTimes(2);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('hit', () => {
    it('should become invulnerable after hit', () => {
      const wasHit = player.hit();
      
      expect(wasHit).toBe(true);
      expect(player.invulnerable).toBe(mockGameConfig.invulnerabilityTime);
    });

    it('should not take damage when invulnerable', () => {
      player.invulnerable = 0.5;
      
      const wasHit = player.hit();
      
      expect(wasHit).toBe(false);
    });

    it('should use shield instead of taking damage', () => {
      player.shieldHealth = 3;
      
      const wasHit = player.hit();
      
      expect(wasHit).toBe(false);
      expect(player.shieldHealth).toBe(2);
      expect(player.invulnerable).toBe(mockGameConfig.invulnerabilityTime * 0.5);
    });
  });

  describe('addPowerup', () => {
    it('should add triple powerup', () => {
      player.addPowerup('triple');
      
      expect(player.powerups.triple).toBe(mockGameConfig.powerupDuration);
    });

    it('should add laser powerup', () => {
      player.addPowerup('laser');
      
      expect(player.powerups.laser).toBe(mockGameConfig.powerupDuration);
    });

    it('should add shield powerup with shield health', () => {
      player.addPowerup('shield');
      
      expect(player.powerups.shield).toBe(mockGameConfig.powerupDuration);
      expect(player.shieldHealth).toBe(3);
    });

    it('should reset powerup timer if already active', () => {
      player.powerups.triple = 5;
      player.addPowerup('triple');
      
      expect(player.powerups.triple).toBe(mockGameConfig.powerupDuration);
    });
  });

  describe('spawnBurst', () => {
    it('should create multiple particles', () => {
      const particles = [];
      
      player.spawnBurst(new Vec2(100, 100), '#fff', 5, 'spark', particles);
      
      expect(particles.length).toBe(5);
      particles.forEach(particle => {
        expect(particle).toBeInstanceOf(Particle);
        expect(particle.color).toBe('#fff');
      });
    });

    it('should create particles with correct properties', () => {
      const particles = [];
      const pos = new Vec2(100, 100);
      
      player.spawnBurst(pos, '#f00', 1, 'spark', particles);
      
      expect(particles[0].pos.x).toBe(100);
      expect(particles[0].pos.y).toBe(100);
      expect(particles[0].type).toBe('spark');
    });
  });
});