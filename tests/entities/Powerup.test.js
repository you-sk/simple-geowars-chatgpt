import Powerup from '../../src/entities/Powerup.js';
import Vec2 from '../../src/entities/Vec2.js';

describe('Powerup', () => {
  let mockGameConfig;
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    mockGameConfig = {
      powerupSpeed: 60
    };
    
    mockCanvas = {
      width: 800,
      height: 600
    };

    mockCtx = {
      fillStyle: '#000',
      strokeStyle: '#000',
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: '#000',
      lineWidth: 1,
      font: '12px monospace',
      textAlign: 'center',
      textBaseline: 'middle',
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn()
    };
  });

  describe('constructor', () => {
    it('should create triple powerup with correct properties', () => {
      const powerup = new Powerup(new Vec2(100, 100), 'triple', mockGameConfig);
      
      expect(powerup.pos.x).toBe(100);
      expect(powerup.pos.y).toBe(100);
      expect(powerup.type).toBe('triple');
      expect(powerup.color).toBe('#ff0');
      expect(powerup.symbol).toBe('3');
      expect(powerup.r).toBe(8);
      expect(powerup.lifetime).toBe(10);
    });

    it('should create laser powerup with correct properties', () => {
      const powerup = new Powerup(new Vec2(100, 100), 'laser', mockGameConfig);
      
      expect(powerup.type).toBe('laser');
      expect(powerup.color).toBe('#f00');
      expect(powerup.symbol).toBe('L');
    });

    it('should create shield powerup with correct properties', () => {
      const powerup = new Powerup(new Vec2(100, 100), 'shield', mockGameConfig);
      
      expect(powerup.type).toBe('shield');
      expect(powerup.color).toBe('#0ff');
      expect(powerup.symbol).toBe('S');
    });

    it('should initialize with random velocity', () => {
      const powerup = new Powerup(new Vec2(100, 100), 'triple', mockGameConfig);
      
      expect(powerup.vel).toBeDefined();
      expect(powerup.vel.x).toBeGreaterThanOrEqual(-30);
      expect(powerup.vel.x).toBeLessThanOrEqual(30);
      expect(powerup.vel.y).toBeGreaterThanOrEqual(-30);
      expect(powerup.vel.y).toBeLessThanOrEqual(30);
    });

    it('should use default config if not provided', () => {
      const powerup = new Powerup(new Vec2(100, 100), 'triple');
      
      expect(powerup.vel).toBeDefined();
      const speed = powerup.vel.len();
      expect(speed).toBeLessThanOrEqual(60 * Math.sqrt(2) / 2);
    });

    it('should initialize age and pulse phase', () => {
      const powerup = new Powerup(new Vec2(100, 100), 'triple');
      
      expect(powerup.age).toBe(0);
      expect(powerup.pulsePhase).toBeGreaterThanOrEqual(0);
      expect(powerup.pulsePhase).toBeLessThan(Math.PI * 2);
    });
  });

  describe('update', () => {
    let powerup;

    beforeEach(() => {
      powerup = new Powerup(new Vec2(400, 300), 'triple', mockGameConfig);
      powerup.vel = new Vec2(50, 50); // Set predictable velocity
    });

    it('should update position based on velocity', () => {
      const dt = 0.1;
      powerup.update(dt, mockCanvas);
      
      expect(powerup.pos.x).toBe(405); // 400 + 50 * 0.1
      expect(powerup.pos.y).toBe(305); // 300 + 50 * 0.1
    });

    it('should increase age and pulse phase', () => {
      const dt = 0.5;
      const initialPhase = powerup.pulsePhase;
      
      powerup.update(dt, mockCanvas);
      
      expect(powerup.age).toBe(0.5);
      expect(powerup.pulsePhase).toBe(initialPhase + dt * 4);
    });

    it('should bounce off left edge', () => {
      powerup.pos = new Vec2(5, 300);
      powerup.vel = new Vec2(-50, 0);
      
      powerup.update(0.1, mockCanvas);
      
      expect(powerup.vel.x).toBeGreaterThan(0); // Reversed direction
    });

    it('should bounce off right edge', () => {
      powerup.pos = new Vec2(795, 300);
      powerup.vel = new Vec2(50, 0);
      
      powerup.update(0.1, mockCanvas);
      
      expect(powerup.vel.x).toBeLessThan(0); // Reversed direction
    });

    it('should bounce off top edge', () => {
      powerup.pos = new Vec2(400, 5);
      powerup.vel = new Vec2(0, -50);
      
      powerup.update(0.1, mockCanvas);
      
      expect(powerup.vel.y).toBeGreaterThan(0); // Reversed direction
    });

    it('should bounce off bottom edge', () => {
      powerup.pos = new Vec2(400, 595);
      powerup.vel = new Vec2(0, 50);
      
      powerup.update(0.1, mockCanvas);
      
      expect(powerup.vel.y).toBeLessThan(0); // Reversed direction
    });

    it('should keep powerup within canvas bounds', () => {
      powerup.pos = new Vec2(900, 700);
      
      powerup.update(0.1, mockCanvas);
      
      expect(powerup.pos.x).toBeLessThanOrEqual(mockCanvas.width - powerup.r);
      expect(powerup.pos.y).toBeLessThanOrEqual(mockCanvas.height - powerup.r);
    });

    it('should return true while alive', () => {
      powerup.age = 5;
      
      const alive = powerup.update(0.1, mockCanvas);
      
      expect(alive).toBe(true);
    });

    it('should return false when lifetime expired', () => {
      powerup.age = 9.9;
      
      const alive = powerup.update(0.2, mockCanvas);
      
      expect(alive).toBe(false);
      expect(powerup.age).toBeGreaterThanOrEqual(powerup.lifetime);
    });
  });

  describe('draw', () => {
    let powerup;

    beforeEach(() => {
      powerup = new Powerup(new Vec2(100, 100), 'triple', mockGameConfig);
    });

    it('should draw outer glow ring', () => {
      powerup.draw(mockCtx);
      
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.strokeStyle).toBe('#ff0');
    });

    it('should draw inner circle', () => {
      powerup.draw(mockCtx);
      
      expect(mockCtx.fill).toHaveBeenCalled();
      // Note: fillStyle is set multiple times during draw, so we check it was called
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
    });

    it('should draw symbol text', () => {
      powerup.draw(mockCtx);
      
      expect(mockCtx.fillText).toHaveBeenCalledWith('3', 100, 100);
      expect(mockCtx.textAlign).toBe('center');
      expect(mockCtx.textBaseline).toBe('middle');
    });

    it('should apply pulsing effect', () => {
      const shadowBlurValues = [];
      Object.defineProperty(mockCtx, 'shadowBlur', {
        get: () => 0,
        set: (value) => shadowBlurValues.push(value)
      });
      
      powerup.pulsePhase = 0; // Sin(0) = 0, so pulse = 0.7
      powerup.draw(mockCtx);
      
      expect(shadowBlurValues).toContain(14); // 20 * 0.7
    });

    it('should fade out in last 2 seconds', () => {
      powerup.age = 9; // 1 second remaining
      
      const alphaValues = [];
      Object.defineProperty(mockCtx, 'globalAlpha', {
        get: () => 1,
        set: (value) => alphaValues.push(value)
      });
      
      powerup.draw(mockCtx);
      
      expect(alphaValues[0]).toBeCloseTo(0.5, 1);
      expect(alphaValues[alphaValues.length - 1]).toBe(1); // Reset
    });

    it('should not fade when not near expiration', () => {
      powerup.age = 5;
      
      const alphaValues = [];
      Object.defineProperty(mockCtx, 'globalAlpha', {
        get: () => 1,
        set: (value) => alphaValues.push(value)
      });
      
      powerup.draw(mockCtx);
      
      expect(alphaValues[0]).toBe(1);
    });

    it('should draw different symbols for different types', () => {
      const laserPowerup = new Powerup(new Vec2(100, 100), 'laser');
      laserPowerup.draw(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith('L', 100, 100);
      
      mockCtx.fillText.mockClear();
      
      const shieldPowerup = new Powerup(new Vec2(100, 100), 'shield');
      shieldPowerup.draw(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith('S', 100, 100);
    });
  });
});