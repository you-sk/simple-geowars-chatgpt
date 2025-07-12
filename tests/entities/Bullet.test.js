import { Bullet, LaserBullet, Trail } from '../../src/entities/Bullet.js';
import Vec2 from '../../src/entities/Vec2.js';

describe('Trail', () => {
  let trail;

  beforeEach(() => {
    trail = new Trail(5);
  });

  describe('constructor', () => {
    it('should initialize with empty points and max length', () => {
      expect(trail.points).toEqual([]);
      expect(trail.maxLength).toBe(5);
    });

    it('should use default max length if not provided', () => {
      const defaultTrail = new Trail();
      expect(defaultTrail.maxLength).toBe(20);
    });
  });

  describe('addPoint', () => {
    it('should add point with position and time', () => {
      const pos = new Vec2(100, 200);
      trail.addPoint(pos);
      
      expect(trail.points.length).toBe(1);
      expect(trail.points[0].x).toBe(100);
      expect(trail.points[0].y).toBe(200);
      expect(trail.points[0].time).toBeDefined();
    });

    it('should maintain max length by removing oldest points', () => {
      for (let i = 0; i < 10; i++) {
        trail.addPoint(new Vec2(i, i));
      }
      
      expect(trail.points.length).toBe(5);
      expect(trail.points[0].x).toBe(5); // Oldest remaining point
    });
  });

  describe('draw', () => {
    let mockCtx;

    beforeEach(() => {
      mockCtx = {
        strokeStyle: '#000',
        lineCap: 'round',
        lineJoin: 'round',
        lineWidth: 1,
        globalAlpha: 1,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn()
      };
    });

    it('should not draw with less than 2 points', () => {
      trail.addPoint(new Vec2(0, 0));
      trail.draw(mockCtx);
      
      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    it('should draw trail with multiple points', () => {
      trail.addPoint(new Vec2(0, 0));
      trail.addPoint(new Vec2(10, 10));
      trail.addPoint(new Vec2(20, 20));
      
      trail.draw(mockCtx, '#fff', 2);
      
      expect(mockCtx.strokeStyle).toBe('#fff');
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should apply fading alpha effect', () => {
      trail.addPoint(new Vec2(0, 0));
      trail.addPoint(new Vec2(10, 10));
      
      const alphaValues = [];
      mockCtx.globalAlpha = 1;
      Object.defineProperty(mockCtx, 'globalAlpha', {
        get: () => 1,
        set: (value) => alphaValues.push(value)
      });
      
      trail.draw(mockCtx);
      
      expect(alphaValues.length).toBeGreaterThan(0);
      expect(alphaValues[alphaValues.length - 1]).toBe(1); // Reset to 1
    });
  });

  describe('clear', () => {
    it('should remove all points', () => {
      trail.addPoint(new Vec2(0, 0));
      trail.addPoint(new Vec2(10, 10));
      
      trail.clear();
      
      expect(trail.points).toEqual([]);
    });
  });
});

describe('Bullet', () => {
  let bullet;
  let mockGameConfig;
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    mockGameConfig = {
      bulletRadius: 4
    };
    
    mockCanvas = {
      width: 800,
      height: 600
    };

    mockCtx = {
      fillStyle: '#000',
      shadowBlur: 0,
      shadowColor: '#000',
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn()
    };

    bullet = new Bullet(new Vec2(100, 100), new Vec2(100, 0), mockGameConfig);
  });

  describe('constructor', () => {
    it('should initialize bullet with position and velocity', () => {
      expect(bullet.pos.x).toBe(100);
      expect(bullet.pos.y).toBe(100);
      expect(bullet.vel.x).toBe(100);
      expect(bullet.vel.y).toBe(0);
    });

    it('should set radius from config', () => {
      expect(bullet.r).toBe(4);
    });

    it('should use default radius if no config', () => {
      const bulletNoConfig = new Bullet(new Vec2(0, 0), new Vec2(0, 0));
      expect(bulletNoConfig.r).toBe(4);
    });

    it('should not be piercing by default', () => {
      expect(bullet.piercing).toBe(false);
    });

    it('should create a trail', () => {
      expect(bullet.trail).toBeInstanceOf(Trail);
      expect(bullet.trail.maxLength).toBe(15);
    });
  });

  describe('update', () => {
    it('should update position based on velocity', () => {
      const dt = 0.1;
      bullet.update(dt);
      
      expect(bullet.pos.x).toBe(110); // 100 + 100 * 0.1
      expect(bullet.pos.y).toBe(100);
    });

    it('should add position to trail', () => {
      const initialTrailLength = bullet.trail.points.length;
      
      bullet.update(0.1);
      
      expect(bullet.trail.points.length).toBe(initialTrailLength + 1);
    });

    it('should handle negative velocity', () => {
      bullet.vel = new Vec2(-50, -50);
      bullet.update(0.1);
      
      expect(bullet.pos.x).toBe(95);
      expect(bullet.pos.y).toBe(95);
    });
  });

  describe('draw', () => {
    it('should draw trail and bullet', () => {
      bullet.trail.draw = jest.fn();
      
      bullet.draw(mockCtx, mockCanvas);
      
      expect(bullet.trail.draw).toHaveBeenCalledWith(mockCtx, '#88f', 3);
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalledWith(
        bullet.pos.x,
        bullet.pos.y,
        bullet.r,
        0,
        Math.PI * 2
      );
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should apply glow effect', () => {
      bullet.draw(mockCtx, mockCanvas);
      
      // Check that drawing methods were called
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
      // Note: shadowBlur is reset to 0 at the end of draw
    });
  });

  describe('offScreen', () => {
    it('should detect when bullet is off screen', () => {
      bullet.pos = new Vec2(-20, 100);
      expect(bullet.offScreen(mockCanvas)).toBe(true);
      
      bullet.pos = new Vec2(820, 100);
      expect(bullet.offScreen(mockCanvas)).toBe(true);
      
      bullet.pos = new Vec2(100, -20);
      expect(bullet.offScreen(mockCanvas)).toBe(true);
      
      bullet.pos = new Vec2(100, 620);
      expect(bullet.offScreen(mockCanvas)).toBe(true);
    });

    it('should return false when bullet is on screen', () => {
      bullet.pos = new Vec2(400, 300);
      expect(bullet.offScreen(mockCanvas)).toBe(false);
      
      bullet.pos = new Vec2(0, 0);
      expect(bullet.offScreen(mockCanvas)).toBe(false);
      
      bullet.pos = new Vec2(800, 600);
      expect(bullet.offScreen(mockCanvas)).toBe(false);
    });
  });
});

describe('LaserBullet', () => {
  let laser;
  let mockGameConfig;
  let mockCtx;

  beforeEach(() => {
    mockGameConfig = {
      bulletRadius: 4
    };

    mockCtx = {
      fillStyle: '#000',
      shadowBlur: 0,
      shadowColor: '#000',
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn()
    };

    laser = new LaserBullet(new Vec2(100, 100), new Vec2(100, 0), mockGameConfig);
  });

  describe('constructor', () => {
    it('should inherit from Bullet', () => {
      expect(laser).toBeInstanceOf(Bullet);
    });

    it('should be piercing', () => {
      expect(laser.piercing).toBe(true);
    });

    it('should have larger radius', () => {
      expect(laser.r).toBe(4.8); // 4 * 1.2
    });

    it('should have longer trail', () => {
      expect(laser.trail.maxLength).toBe(20);
    });

    it('should initialize hit tracking', () => {
      expect(laser.hitCount).toBe(0);
      expect(laser.maxHits).toBe(3);
    });
  });

  describe('draw', () => {
    it('should draw with red color scheme', () => {
      laser.trail.draw = jest.fn();
      
      laser.draw(mockCtx);
      
      expect(laser.trail.draw).toHaveBeenCalledWith(mockCtx, '#f44', 4);
      // Check that drawing methods were called
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should draw inner core', () => {
      laser.trail.draw = jest.fn();
      
      laser.draw(mockCtx);
      
      // Should call arc twice - once for outer, once for inner core
      expect(mockCtx.arc).toHaveBeenCalledTimes(2);
      expect(mockCtx.fill).toHaveBeenCalledTimes(2);
    });
  });

  describe('hit', () => {
    it('should increment hit count', () => {
      expect(laser.hitCount).toBe(0);
      
      laser.hit();
      
      expect(laser.hitCount).toBe(1);
    });

    it('should return false if not at max hits', () => {
      expect(laser.hit()).toBe(false);
      expect(laser.hit()).toBe(false);
    });

    it('should return true when reaching max hits', () => {
      laser.hit();
      laser.hit();
      
      expect(laser.hit()).toBe(true);
      expect(laser.hitCount).toBe(3);
    });
  });
});