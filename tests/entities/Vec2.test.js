import Vec2 from '../../src/entities/Vec2.js';

describe('Vec2', () => {
  describe('constructor', () => {
    it('should create a vector with given x and y values', () => {
      const vec = new Vec2(3, 4);
      expect(vec.x).toBe(3);
      expect(vec.y).toBe(4);
    });

    it('should handle negative values', () => {
      const vec = new Vec2(-5, -10);
      expect(vec.x).toBe(-5);
      expect(vec.y).toBe(-10);
    });

    it('should handle zero values', () => {
      const vec = new Vec2(0, 0);
      expect(vec.x).toBe(0);
      expect(vec.y).toBe(0);
    });

    it('should handle decimal values', () => {
      const vec = new Vec2(1.5, 2.7);
      expect(vec.x).toBe(1.5);
      expect(vec.y).toBe(2.7);
    });
  });

  describe('add', () => {
    it('should add two vectors correctly', () => {
      const vec1 = new Vec2(1, 2);
      const vec2 = new Vec2(3, 4);
      const result = vec1.add(vec2);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
      expect(result).toBeInstanceOf(Vec2);
    });

    it('should not modify the original vectors', () => {
      const vec1 = new Vec2(1, 2);
      const vec2 = new Vec2(3, 4);
      vec1.add(vec2);
      
      expect(vec1.x).toBe(1);
      expect(vec1.y).toBe(2);
      expect(vec2.x).toBe(3);
      expect(vec2.y).toBe(4);
    });

    it('should handle negative values', () => {
      const vec1 = new Vec2(5, 10);
      const vec2 = new Vec2(-3, -7);
      const result = vec1.add(vec2);
      
      expect(result.x).toBe(2);
      expect(result.y).toBe(3);
    });
  });

  describe('sub', () => {
    it('should subtract two vectors correctly', () => {
      const vec1 = new Vec2(5, 10);
      const vec2 = new Vec2(3, 4);
      const result = vec1.sub(vec2);
      
      expect(result.x).toBe(2);
      expect(result.y).toBe(6);
      expect(result).toBeInstanceOf(Vec2);
    });

    it('should not modify the original vectors', () => {
      const vec1 = new Vec2(5, 10);
      const vec2 = new Vec2(3, 4);
      vec1.sub(vec2);
      
      expect(vec1.x).toBe(5);
      expect(vec1.y).toBe(10);
      expect(vec2.x).toBe(3);
      expect(vec2.y).toBe(4);
    });

    it('should handle negative results', () => {
      const vec1 = new Vec2(2, 3);
      const vec2 = new Vec2(5, 7);
      const result = vec1.sub(vec2);
      
      expect(result.x).toBe(-3);
      expect(result.y).toBe(-4);
    });
  });

  describe('mul', () => {
    it('should multiply vector by scalar correctly', () => {
      const vec = new Vec2(3, 4);
      const result = vec.mul(2);
      
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
      expect(result).toBeInstanceOf(Vec2);
    });

    it('should not modify the original vector', () => {
      const vec = new Vec2(3, 4);
      vec.mul(2);
      
      expect(vec.x).toBe(3);
      expect(vec.y).toBe(4);
    });

    it('should handle negative scalar', () => {
      const vec = new Vec2(3, 4);
      const result = vec.mul(-2);
      
      expect(result.x).toBe(-6);
      expect(result.y).toBe(-8);
    });

    it('should handle zero scalar', () => {
      const vec = new Vec2(3, 4);
      const result = vec.mul(0);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle decimal scalar', () => {
      const vec = new Vec2(4, 8);
      const result = vec.mul(0.5);
      
      expect(result.x).toBe(2);
      expect(result.y).toBe(4);
    });
  });

  describe('len', () => {
    it('should calculate length correctly', () => {
      const vec = new Vec2(3, 4);
      expect(vec.len()).toBe(5); // 3² + 4² = 9 + 16 = 25, sqrt(25) = 5
    });

    it('should handle zero vector', () => {
      const vec = new Vec2(0, 0);
      expect(vec.len()).toBe(0);
    });

    it('should handle negative values', () => {
      const vec = new Vec2(-3, -4);
      expect(vec.len()).toBe(5);
    });

    it('should handle unit vector', () => {
      const vec = new Vec2(1, 0);
      expect(vec.len()).toBe(1);
    });

    it('should handle decimal values', () => {
      const vec = new Vec2(0.6, 0.8);
      expect(vec.len()).toBeCloseTo(1, 10);
    });
  });

  describe('norm', () => {
    it('should normalize vector correctly', () => {
      const vec = new Vec2(3, 4);
      const result = vec.norm();
      
      expect(result.len()).toBeCloseTo(1, 10);
      expect(result.x).toBeCloseTo(0.6, 10);
      expect(result.y).toBeCloseTo(0.8, 10);
    });

    it('should not modify the original vector', () => {
      const vec = new Vec2(3, 4);
      vec.norm();
      
      expect(vec.x).toBe(3);
      expect(vec.y).toBe(4);
    });

    it('should handle zero vector', () => {
      const vec = new Vec2(0, 0);
      const result = vec.norm();
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result).toBeInstanceOf(Vec2);
    });

    it('should handle already normalized vector', () => {
      const vec = new Vec2(1, 0);
      const result = vec.norm();
      
      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
      expect(result.len()).toBe(1);
    });

    it('should handle negative values', () => {
      const vec = new Vec2(-3, -4);
      const result = vec.norm();
      
      expect(result.len()).toBeCloseTo(1, 10);
      expect(result.x).toBeCloseTo(-0.6, 10);
      expect(result.y).toBeCloseTo(-0.8, 10);
    });
  });

  describe('chain operations', () => {
    it('should support chaining operations', () => {
      const vec1 = new Vec2(1, 0);
      const vec2 = new Vec2(0, 1);
      const result = vec1.add(vec2).mul(2).norm();
      
      expect(result.len()).toBeCloseTo(1, 10);
      expect(result.x).toBeCloseTo(Math.sqrt(2) / 2, 10);
      expect(result.y).toBeCloseTo(Math.sqrt(2) / 2, 10);
    });
  });
});