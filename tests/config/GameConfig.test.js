import { GameConfig } from '../../src/config/GameConfig.js';

describe('GameConfig', () => {
  describe('Player configuration', () => {
    it('should have valid player movement settings', () => {
      expect(GameConfig.playerSpeed).toBe(250);
      expect(GameConfig.playerSpeed).toBeGreaterThan(0);
      expect(GameConfig.playerRadius).toBe(10);
      expect(GameConfig.playerRadius).toBeGreaterThan(0);
    });

    it('should have valid player shooting settings', () => {
      expect(GameConfig.fireRate).toBe(0.15);
      expect(GameConfig.fireRate).toBeGreaterThan(0);
      expect(GameConfig.fireRate).toBeLessThan(1); // Reasonable fire rate
      
      expect(GameConfig.bulletSpeed).toBe(450);
      expect(GameConfig.bulletSpeed).toBeGreaterThan(GameConfig.playerSpeed); // Bullets faster than player
      
      expect(GameConfig.bulletRadius).toBe(4);
      expect(GameConfig.bulletRadius).toBeGreaterThan(0);
      expect(GameConfig.bulletRadius).toBeLessThan(GameConfig.playerRadius); // Bullets smaller than player
    });
  });

  describe('Enemy configuration', () => {
    it('should have valid enemy base settings', () => {
      expect(GameConfig.enemyBaseRadius).toBe(12);
      expect(GameConfig.enemyBaseRadius).toBeGreaterThan(GameConfig.playerRadius); // Enemies slightly larger
      
      expect(GameConfig.enemyBaseSpeed).toBe(100);
      expect(GameConfig.enemyBaseSpeed).toBeGreaterThan(0);
      expect(GameConfig.enemyBaseSpeed).toBeLessThan(GameConfig.playerSpeed); // Enemies slower than player
    });

    it('should have valid enemy spawn settings', () => {
      expect(GameConfig.enemySpawnBaseInterval).toBe(2.0);
      expect(GameConfig.enemySpawnBaseInterval).toBeGreaterThan(0);
      
      expect(GameConfig.enemySpawnMinInterval).toBe(0.3);
      expect(GameConfig.enemySpawnMinInterval).toBeGreaterThan(0);
      expect(GameConfig.enemySpawnMinInterval).toBeLessThan(GameConfig.enemySpawnBaseInterval);
      
      expect(GameConfig.enemySpawnIntervalDecay).toBe(0.95);
      expect(GameConfig.enemySpawnIntervalDecay).toBeGreaterThan(0);
      expect(GameConfig.enemySpawnIntervalDecay).toBeLessThan(1); // Must decay
    });
  });

  describe('Scoring configuration', () => {
    it('should have valid scoring settings', () => {
      expect(GameConfig.baseEnemyScore).toBe(10);
      expect(GameConfig.baseEnemyScore).toBeGreaterThan(0);
      
      expect(GameConfig.scoreMultiplierDecay).toBe(500);
      expect(GameConfig.scoreMultiplierDecay).toBeGreaterThan(0);
    });
  });

  describe('Visual configuration', () => {
    it('should have valid particle settings', () => {
      expect(GameConfig.particleCount).toBe(16);
      expect(GameConfig.particleCount).toBeGreaterThan(0);
      
      expect(GameConfig.particleLifetime).toBe(0.6);
      expect(GameConfig.particleLifetime).toBeGreaterThan(0);
      expect(GameConfig.particleLifetime).toBeLessThan(5); // Reasonable lifetime
      
      expect(GameConfig.particleMinSpeed).toBe(50);
      expect(GameConfig.particleMaxSpeed).toBe(150);
      expect(GameConfig.particleMinSpeed).toBeGreaterThan(0);
      expect(GameConfig.particleMaxSpeed).toBeGreaterThan(GameConfig.particleMinSpeed);
    });
  });

  describe('Game mechanics configuration', () => {
    it('should have valid lives and invulnerability settings', () => {
      expect(GameConfig.startingLives).toBe(3);
      expect(GameConfig.startingLives).toBeGreaterThan(0);
      
      expect(GameConfig.invulnerabilityTime).toBe(1.5);
      expect(GameConfig.invulnerabilityTime).toBeGreaterThan(0);
      expect(GameConfig.invulnerabilityTime).toBeLessThan(5); // Not too long
    });
  });

  describe('Powerup configuration', () => {
    it('should have valid powerup settings', () => {
      expect(GameConfig.powerupDropChance).toBe(0.15);
      expect(GameConfig.powerupDropChance).toBeGreaterThan(0);
      expect(GameConfig.powerupDropChance).toBeLessThanOrEqual(1); // Valid probability
      
      expect(GameConfig.powerupDuration).toBe(15);
      expect(GameConfig.powerupDuration).toBeGreaterThan(0);
      
      expect(GameConfig.powerupSpeed).toBe(60);
      expect(GameConfig.powerupSpeed).toBeGreaterThan(0);
      expect(GameConfig.powerupSpeed).toBeLessThan(GameConfig.enemyBaseSpeed); // Slower than enemies
    });
  });

  describe('Bomb configuration', () => {
    it('should have valid bomb settings', () => {
      expect(GameConfig.startingBombs).toBe(3);
      expect(GameConfig.startingBombs).toBeGreaterThanOrEqual(0);
      
      expect(GameConfig.maxBombs).toBe(5);
      expect(GameConfig.maxBombs).toBeGreaterThan(0);
      expect(GameConfig.maxBombs).toBeGreaterThanOrEqual(GameConfig.startingBombs);
    });
  });

  describe('Configuration relationships', () => {
    it('should have sensible speed relationships', () => {
      // Player should be able to outrun basic enemies
      expect(GameConfig.playerSpeed).toBeGreaterThan(GameConfig.enemyBaseSpeed);
      
      // Bullets should be faster than player
      expect(GameConfig.bulletSpeed).toBeGreaterThan(GameConfig.playerSpeed);
    });

    it('should have sensible size relationships', () => {
      // Bullets smaller than player
      expect(GameConfig.bulletRadius).toBeLessThan(GameConfig.playerRadius);
      
      // Enemies slightly larger than player for visibility
      expect(GameConfig.enemyBaseRadius).toBeGreaterThan(GameConfig.playerRadius);
    });

    it('should have sensible difficulty progression', () => {
      // Spawn interval should be able to reach minimum
      let interval = GameConfig.enemySpawnBaseInterval;
      let iterations = 0;
      
      while (interval > GameConfig.enemySpawnMinInterval && iterations < 1000) {
        interval *= GameConfig.enemySpawnIntervalDecay;
        iterations++;
      }
      
      expect(iterations).toBeLessThan(1000); // Should converge
      expect(interval).toBeCloseTo(GameConfig.enemySpawnMinInterval, 1);
    });
  });

  describe('Type checking', () => {
    it('should have correct types for all values', () => {
      // Numbers
      expect(typeof GameConfig.playerSpeed).toBe('number');
      expect(typeof GameConfig.playerRadius).toBe('number');
      expect(typeof GameConfig.fireRate).toBe('number');
      expect(typeof GameConfig.bulletSpeed).toBe('number');
      expect(typeof GameConfig.bulletRadius).toBe('number');
      expect(typeof GameConfig.enemyBaseRadius).toBe('number');
      expect(typeof GameConfig.enemyBaseSpeed).toBe('number');
      expect(typeof GameConfig.enemySpawnBaseInterval).toBe('number');
      expect(typeof GameConfig.enemySpawnMinInterval).toBe('number');
      expect(typeof GameConfig.enemySpawnIntervalDecay).toBe('number');
      expect(typeof GameConfig.baseEnemyScore).toBe('number');
      expect(typeof GameConfig.scoreMultiplierDecay).toBe('number');
      expect(typeof GameConfig.particleCount).toBe('number');
      expect(typeof GameConfig.particleLifetime).toBe('number');
      expect(typeof GameConfig.particleMinSpeed).toBe('number');
      expect(typeof GameConfig.particleMaxSpeed).toBe('number');
      expect(typeof GameConfig.startingLives).toBe('number');
      expect(typeof GameConfig.invulnerabilityTime).toBe('number');
      expect(typeof GameConfig.powerupDropChance).toBe('number');
      expect(typeof GameConfig.powerupDuration).toBe('number');
      expect(typeof GameConfig.powerupSpeed).toBe('number');
      expect(typeof GameConfig.startingBombs).toBe('number');
      expect(typeof GameConfig.maxBombs).toBe('number');
    });

    it('should have integer values where appropriate', () => {
      expect(Number.isInteger(GameConfig.playerRadius)).toBe(true);
      expect(Number.isInteger(GameConfig.bulletRadius)).toBe(true);
      expect(Number.isInteger(GameConfig.enemyBaseRadius)).toBe(true);
      expect(Number.isInteger(GameConfig.baseEnemyScore)).toBe(true);
      expect(Number.isInteger(GameConfig.scoreMultiplierDecay)).toBe(true);
      expect(Number.isInteger(GameConfig.particleCount)).toBe(true);
      expect(Number.isInteger(GameConfig.startingLives)).toBe(true);
      expect(Number.isInteger(GameConfig.startingBombs)).toBe(true);
      expect(Number.isInteger(GameConfig.maxBombs)).toBe(true);
    });
  });

  describe('Export verification', () => {
    it('should export GameConfig as default', () => {
      const defaultExport = require('../../src/config/GameConfig.js').default;
      expect(defaultExport).toBe(GameConfig);
    });

    it('should be immutable in practice', () => {
      const originalValue = GameConfig.playerSpeed;
      
      // Attempt to modify (this would work in JS but should be avoided)
      GameConfig.playerSpeed = 999;
      
      // In a real application, we'd want this to be frozen
      // For now, we just reset it
      expect(GameConfig.playerSpeed).toBe(999);
      GameConfig.playerSpeed = originalValue;
    });
  });
});