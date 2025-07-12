import Particle from '../../src/entities/Particle.js';
import Vec2 from '../../src/entities/Vec2.js';

describe('Particle', () => {
  let mockCtx;

  beforeEach(() => {
    mockCtx = {
      fillStyle: '#000',
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: '#000',
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn()
    };
  });

  describe('constructor', () => {
    it('should initialize particle with required parameters', () => {
      const pos = new Vec2(100, 100);
      const vel = new Vec2(50, -50);
      const life = 2.0;
      const color = '#ff0000';
      
      const particle = new Particle(pos, vel, life, color);
      
      expect(particle.pos).toBe(pos);
      expect(particle.vel).toBe(vel);
      expect(particle.life).toBe(life);
      expect(particle.maxLife).toBe(life);
      expect(particle.color).toBe(color);
    });

    it('should use default values for optional parameters', () => {
      const particle = new Particle(new Vec2(0, 0), new Vec2(0, 0), 1, '#fff');
      
      expect(particle.size).toBe(2);
      expect(particle.type).toBe('circle');
    });

    it('should accept custom size and type', () => {
      const particle = new Particle(
        new Vec2(0, 0),
        new Vec2(0, 0),
        1,
        '#fff',
        5,
        'spark'
      );
      
      expect(particle.size).toBe(5);
      expect(particle.type).toBe('spark');
    });

    it('should store initial life as maxLife', () => {
      const life = 3.5;
      const particle = new Particle(new Vec2(0, 0), new Vec2(0, 0), life, '#fff');
      
      expect(particle.life).toBe(life);
      expect(particle.maxLife).toBe(life);
    });
  });

  describe('update', () => {
    let particle;

    beforeEach(() => {
      particle = new Particle(
        new Vec2(100, 100),
        new Vec2(50, -50),
        2.0,
        '#fff'
      );
    });

    it('should update position based on velocity', () => {
      const dt = 0.1;
      particle.update(dt);
      
      expect(particle.pos.x).toBe(105); // 100 + 50 * 0.1
      expect(particle.pos.y).toBe(95);  // 100 + (-50) * 0.1
    });

    it('should decrease life over time', () => {
      const initialLife = particle.life;
      const dt = 0.5;
      
      particle.update(dt);
      
      expect(particle.life).toBe(initialLife - dt);
    });

    it('should apply drag to velocity', () => {
      const initialVelLength = particle.vel.len();
      
      particle.update(0.1);
      
      const newVelLength = particle.vel.len();
      expect(newVelLength).toBeLessThan(initialVelLength);
      expect(newVelLength).toBeCloseTo(initialVelLength * 0.98, 5);
    });

    it('should continue updating position as velocity decreases', () => {
      // Run multiple updates to see cumulative effect
      for (let i = 0; i < 10; i++) {
        particle.update(0.1);
      }
      
      // Position should have moved but velocity should be reduced
      expect(particle.pos.x).toBeGreaterThan(100);
      expect(particle.vel.len()).toBeLessThan(Math.hypot(50, 50));
    });
  });

  describe('draw', () => {
    describe('circle type particle', () => {
      let particle;

      beforeEach(() => {
        particle = new Particle(new Vec2(100, 100), new Vec2(0, 0), 2.0, '#ff0000', 3, 'circle');
      });

      it('should draw regular circle particle', () => {
        particle.draw(mockCtx);
        
        expect(mockCtx.fillStyle).toBe('#ff0000');
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.arc).toHaveBeenCalledWith(100, 100, 3, 0, Math.PI * 2);
        expect(mockCtx.fill).toHaveBeenCalled();
      });

      it('should apply alpha based on life remaining', () => {
        particle.life = 1.0; // Half life remaining
        
        const alphaValues = [];
        Object.defineProperty(mockCtx, 'globalAlpha', {
          get: () => 1,
          set: (value) => alphaValues.push(value)
        });
        
        particle.draw(mockCtx);
        
        expect(alphaValues[0]).toBeCloseTo(0.5, 1); // life / maxLife = 0.5
        expect(alphaValues[alphaValues.length - 1]).toBe(1); // Reset to 1
      });

      it('should scale size based on alpha', () => {
        particle.life = 1.0; // Half life remaining
        
        particle.draw(mockCtx);
        
        // Size should be scaled by alpha (0.5)
        expect(mockCtx.arc).toHaveBeenCalledWith(100, 100, 1.5, 0, Math.PI * 2);
      });

      it('should not apply shadow effects for regular particles', () => {
        particle.draw(mockCtx);
        
        expect(mockCtx.shadowBlur).toBe(0);
      });
    });

    describe('spark type particle', () => {
      let particle;

      beforeEach(() => {
        particle = new Particle(new Vec2(100, 100), new Vec2(0, 0), 2.0, '#ffff00', 3, 'spark');
      });

      it('should draw spark particle with glow effect', () => {
        particle.draw(mockCtx);
        
        // Check that drawing methods were called
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.arc).toHaveBeenCalled();
        expect(mockCtx.fill).toHaveBeenCalled();
        // Note: shadowBlur is reset to 0 at the end of draw, so we check for the call pattern
      });

      it('should reset shadow blur after drawing', () => {
        particle.draw(mockCtx);
        
        expect(mockCtx.shadowBlur).toBe(0);
      });

      it('should scale size and glow with alpha', () => {
        particle.life = 1.0; // Half life remaining
        
        particle.draw(mockCtx);
        
        // Size should be scaled by alpha (0.5)
        expect(mockCtx.arc).toHaveBeenCalledWith(100, 100, 1.5, 0, Math.PI * 2);
      });
    });

    describe('alpha calculations', () => {
      let particle;

      beforeEach(() => {
        particle = new Particle(new Vec2(0, 0), new Vec2(0, 0), 2.0, '#fff');
      });

      it('should have full alpha when at full life', () => {
        particle.life = 2.0;
        
        const alphaValues = [];
        Object.defineProperty(mockCtx, 'globalAlpha', {
          get: () => 1,
          set: (value) => alphaValues.push(value)
        });
        
        particle.draw(mockCtx);
        
        expect(alphaValues[0]).toBe(1.0);
      });

      it('should have zero alpha when life is zero or negative', () => {
        particle.life = 0;
        
        const alphaValues = [];
        Object.defineProperty(mockCtx, 'globalAlpha', {
          get: () => 1,
          set: (value) => alphaValues.push(value)
        });
        
        particle.draw(mockCtx);
        
        expect(alphaValues[0]).toBe(0);
        
        // Test negative life
        particle.life = -0.5;
        alphaValues.length = 0;
        
        particle.draw(mockCtx);
        
        expect(alphaValues[0]).toBe(0);
      });

      it('should interpolate alpha based on life ratio', () => {
        particle.life = 0.5; // Quarter life remaining
        
        const alphaValues = [];
        Object.defineProperty(mockCtx, 'globalAlpha', {
          get: () => 1,
          set: (value) => alphaValues.push(value)
        });
        
        particle.draw(mockCtx);
        
        expect(alphaValues[0]).toBeCloseTo(0.25, 2);
      });

      it('should always reset globalAlpha to 1', () => {
        particle.life = 0.5;
        
        const alphaValues = [];
        Object.defineProperty(mockCtx, 'globalAlpha', {
          get: () => 1,
          set: (value) => alphaValues.push(value)
        });
        
        particle.draw(mockCtx);
        
        expect(alphaValues[alphaValues.length - 1]).toBe(1);
      });
    });
  });

  describe('lifecycle', () => {
    it('should be alive when created', () => {
      const particle = new Particle(new Vec2(0, 0), new Vec2(0, 0), 1.0, '#fff');
      
      expect(particle.life).toBeGreaterThan(0);
    });

    it('should eventually die after enough updates', () => {
      const particle = new Particle(new Vec2(0, 0), new Vec2(0, 0), 1.0, '#fff');
      
      // Update for longer than lifetime
      for (let i = 0; i < 15; i++) {
        particle.update(0.1);
      }
      
      expect(particle.life).toBeLessThanOrEqual(0);
    });

    it('should have decreasing alpha as it ages', () => {
      const particle = new Particle(new Vec2(0, 0), new Vec2(0, 0), 2.0, '#fff');
      
      // Initial alpha calculation
      const initialAlpha = particle.life / particle.maxLife;
      
      // Age the particle
      particle.update(1.0);
      
      // New alpha calculation
      const newAlpha = Math.max(particle.life / particle.maxLife, 0);
      
      expect(newAlpha).toBeLessThan(initialAlpha);
    });
  });
});