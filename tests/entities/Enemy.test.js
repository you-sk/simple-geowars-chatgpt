import Enemy from '../../src/entities/Enemy.js';
import Vec2 from '../../src/entities/Vec2.js';

describe('Enemy', () => {
  let mockCanvas;
  let mockGameConfig;
  let mockCtx;

  beforeEach(() => {
    mockCanvas = {
      width: 800,
      height: 600
    };
    
    mockGameConfig = {
      enemyBaseRadius: 12,
      baseEnemyScore: 10
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
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn()
    };
  });

  describe('constructor', () => {
    it('should create basic enemy with correct properties', () => {
      const pos = new Vec2(100, 100);
      const vel = new Vec2(50, 50);
      const enemy = new Enemy(pos, vel, 'basic', mockGameConfig);
      
      expect(enemy.pos).toBe(pos);
      expect(enemy.vel).toBe(vel);
      expect(enemy.type).toBe('basic');
      expect(enemy.r).toBe(12);
      expect(enemy.scoreValue).toBe(10);
      expect(enemy.color).toBe('#f0f');
      expect(enemy.maxSpeed).toBe(150);
    });

    it('should create homing enemy with correct properties', () => {
      const enemy = new Enemy(new Vec2(0, 0), new Vec2(0, 0), 'homing', mockGameConfig);
      
      expect(enemy.type).toBe('homing');
      expect(enemy.r).toBe(12 * 0.8);
      expect(enemy.scoreValue).toBe(20);
      expect(enemy.color).toBe('#f80');
      expect(enemy.maxSpeed).toBe(120);
      expect(enemy.homingStrength).toBe(80);
    });

    it('should create splitter enemy with correct properties', () => {
      const enemy = new Enemy(new Vec2(0, 0), new Vec2(0, 0), 'splitter', mockGameConfig);
      
      expect(enemy.type).toBe('splitter');
      expect(enemy.r).toBe(12 * 1.2);
      expect(enemy.scoreValue).toBe(30);
      expect(enemy.color).toBe('#8f0');
      expect(enemy.maxSpeed).toBe(100);
      expect(enemy.hasSpawned).toBe(false);
    });

    it('should create fast enemy with correct properties', () => {
      const enemy = new Enemy(new Vec2(0, 0), new Vec2(0, 0), 'fast', mockGameConfig);
      
      expect(enemy.type).toBe('fast');
      expect(enemy.r).toBe(12 * 0.6);
      expect(enemy.scoreValue).toBe(15);
      expect(enemy.color).toBe('#0ff');
      expect(enemy.maxSpeed).toBe(300);
    });

    it('should create mini enemy with correct properties', () => {
      const enemy = new Enemy(new Vec2(0, 0), new Vec2(0, 0), 'mini', mockGameConfig);
      
      expect(enemy.type).toBe('mini');
      expect(enemy.r).toBe(12 * 0.4);
      expect(enemy.scoreValue).toBe(5);
      expect(enemy.color).toBe('#8f8');
      expect(enemy.maxSpeed).toBe(120);
    });

    it('should use default config if not provided', () => {
      const enemy = new Enemy(new Vec2(0, 0), new Vec2(0, 0), 'basic');
      
      expect(enemy.r).toBe(12);
      expect(enemy.scoreValue).toBe(10);
    });

    it('should default to basic type if not specified', () => {
      const enemy = new Enemy(new Vec2(0, 0), new Vec2(0, 0));
      
      expect(enemy.type).toBe('basic');
    });
  });

  describe('update', () => {
    it('should update position based on velocity', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(50, 0), 'basic');
      const dt = 0.1;
      
      enemy.update(dt, null, mockCanvas);
      
      expect(enemy.pos.x).toBe(105); // 100 + 50 * 0.1
      expect(enemy.pos.y).toBe(100);
    });

    it('should increase age over time', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'basic');
      
      enemy.update(0.5, null, mockCanvas);
      
      expect(enemy.age).toBe(0.5);
    });

    it('should bounce off canvas edges', () => {
      const enemy = new Enemy(new Vec2(790, 100), new Vec2(100, 0), 'basic');
      
      enemy.update(0.1, null, mockCanvas);
      
      expect(enemy.vel.x).toBeLessThan(0); // Should reverse direction
    });

    it('should keep enemy within canvas bounds', () => {
      const enemy = new Enemy(new Vec2(900, 100), new Vec2(100, 0), 'basic');
      
      enemy.update(0.1, null, mockCanvas);
      
      expect(enemy.pos.x).toBeLessThanOrEqual(mockCanvas.width - enemy.r);
    });

    describe('homing behavior', () => {
      it('should track player position', () => {
        const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'homing');
        const playerPos = new Vec2(200, 100);
        
        enemy.update(0.1, playerPos, mockCanvas);
        
        expect(enemy.vel.x).toBeGreaterThan(0); // Moving towards player
      });

      it('should respect max speed when homing', () => {
        const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'homing');
        const playerPos = new Vec2(500, 100);
        
        for (let i = 0; i < 10; i++) {
          enemy.update(0.1, playerPos, mockCanvas);
        }
        
        const speed = enemy.vel.len();
        expect(speed).toBeLessThanOrEqual(enemy.maxSpeed);
      });

      it('should gradually adjust direction', () => {
        const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 100), 'homing');
        const playerPos = new Vec2(200, 100);
        const initialVelY = enemy.vel.y;
        
        enemy.update(0.1, playerPos, mockCanvas);
        
        expect(Math.abs(enemy.vel.y)).toBeLessThan(Math.abs(initialVelY));
      });
    });

    describe('fast enemy behavior', () => {
      it('should maintain high speed', () => {
        const enemy = new Enemy(new Vec2(100, 100), new Vec2(50, 0), 'fast');
        
        enemy.update(0.1, null, mockCanvas);
        
        const speed = enemy.vel.len();
        expect(speed).toBeCloseTo(enemy.maxSpeed, 0);
      });

      it('should accelerate if below max speed', () => {
        const enemy = new Enemy(new Vec2(100, 100), new Vec2(50, 0), 'fast');
        const initialSpeed = enemy.vel.len();
        
        enemy.update(0.1, null, mockCanvas);
        
        const newSpeed = enemy.vel.len();
        expect(newSpeed).toBeGreaterThan(initialSpeed);
      });
    });

    it('should update trail points', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(50, 50), 'basic');
      const initialTrailLength = enemy.trail.points.length;
      
      enemy.update(0.1, null, mockCanvas);
      
      expect(enemy.trail.points.length).toBeGreaterThan(initialTrailLength);
    });

    it('should update pulse phase', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'basic');
      const initialPhase = enemy.pulsePhase;
      
      enemy.update(0.1, null, mockCanvas);
      
      expect(enemy.pulsePhase).toBeGreaterThan(initialPhase);
    });
  });

  describe('draw', () => {
    it('should call draw methods for basic enemy', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'basic');
      enemy.trail.draw = jest.fn();
      
      enemy.draw(mockCtx);
      
      expect(enemy.trail.draw).toHaveBeenCalledWith(mockCtx, '#f0f', 1);
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw splitter with segments', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'splitter');
      enemy.trail.draw = jest.fn();
      
      enemy.draw(mockCtx);
      
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw homing enemy as triangle', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(50, 0), 'homing');
      enemy.trail.draw = jest.fn();
      
      enemy.draw(mockCtx);
      
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalled();
      expect(mockCtx.rotate).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should draw fast enemy with thicker line', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'fast');
      enemy.trail.draw = jest.fn();
      
      enemy.draw(mockCtx);
      
      expect(enemy.trail.draw).toHaveBeenCalledWith(mockCtx, '#0ff', 2);
    });
  });

  describe('onDestroy', () => {
    it('should return empty array for basic enemy', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'basic');
      
      const spawned = enemy.onDestroy();
      
      expect(spawned).toEqual([]);
    });

    it('should spawn mini enemies for splitter', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'splitter');
      
      const spawned = enemy.onDestroy();
      
      expect(spawned.length).toBe(3);
      spawned.forEach(mini => {
        expect(mini).toBeInstanceOf(Enemy);
        expect(mini.type).toBe('mini');
        expect(mini.pos.x).toBe(100);
        expect(mini.pos.y).toBe(100);
      });
    });

    it('should spawn mini enemies in different directions', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'splitter');
      
      const spawned = enemy.onDestroy();
      
      const velocities = spawned.map(e => ({ x: e.vel.x, y: e.vel.y }));
      // Check that velocities are different
      expect(velocities[0]).not.toEqual(velocities[1]);
      expect(velocities[1]).not.toEqual(velocities[2]);
    });

    it('should only spawn once for splitter', () => {
      const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), 'splitter');
      
      const spawned1 = enemy.onDestroy();
      const spawned2 = enemy.onDestroy();
      
      expect(spawned1.length).toBe(3);
      expect(spawned2.length).toBe(0);
    });

    it('should return empty array for other enemy types', () => {
      const types = ['homing', 'fast', 'mini'];
      
      types.forEach(type => {
        const enemy = new Enemy(new Vec2(100, 100), new Vec2(0, 0), type);
        const spawned = enemy.onDestroy();
        expect(spawned).toEqual([]);
      });
    });
  });
});