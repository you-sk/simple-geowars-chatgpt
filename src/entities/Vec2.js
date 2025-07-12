/**
 * 2D Vector utility class for mathematical operations
 */
class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mul(s) {
    return new Vec2(this.x * s, this.y * s);
  }

  len() {
    return Math.hypot(this.x, this.y);
  }

  norm() {
    const l = this.len();
    return l ? this.mul(1 / l) : new Vec2(0, 0);
  }
}

export default Vec2;
