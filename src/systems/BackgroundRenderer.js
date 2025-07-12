/**
 * BackgroundRenderer handles all background visual effects including:
 * - Animated star field with twinkling
 * - Moving grid pattern
 * - Subtle scan lines
 */
class BackgroundRenderer {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      starCount: 150,
      gridSize: 50,
      gridSpeed: 10, // pixels per second
      scanLineSpeed: 20,
      scanLineSpacing: 4,
      gridColor: 'rgba(0, 255, 0, 0.08)',
      gridDotColor: 'rgba(0, 255, 0, 0.15)',
      scanLineColor: 'rgba(0, 255, 255, 0.03)',
      starAlphaMultiplier: 0.6,
      ...config
    };

    this.stars = [];
    this.gridOffset = { x: 0, y: 0 };
    this.time = 0;

    this.generateStars();
  }

  /**
   * Generate random stars for the background
   */
  generateStars() {
    this.stars = [];
    for (let i = 0; i < this.config.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Update background animations
   */
  update(deltaTime) {
    this.time += deltaTime;

    // Slowly drift the grid
    this.gridOffset.x += this.config.gridSpeed * deltaTime;
    this.gridOffset.y += this.config.gridSpeed * deltaTime * 0.7; // Different speed for more organic feel

    // Wrap grid offset
    this.gridOffset.x %= this.config.gridSize;
    this.gridOffset.y %= this.config.gridSize;

    // Update stars for twinkling
    this.stars.forEach(star => {
      star.twinklePhase += star.twinkleSpeed * deltaTime;
    });
  }

  /**
   * Render all background elements
   */
  render(ctx, deltaTime) {
    // Update animation state
    this.update(deltaTime);

    // Draw animated grid
    this.drawGrid(ctx);

    // Draw twinkling stars
    this.drawStars(ctx);

    // Draw subtle scan lines
    this.drawScanLines(ctx);
  }

  /**
   * Draw the animated grid pattern
   */
  drawGrid(ctx) {
    ctx.strokeStyle = this.config.gridColor;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;

    const startX = -this.gridOffset.x;
    const startY = -this.gridOffset.y;

    // Vertical lines
    for (let x = startX; x < this.canvas.width + this.config.gridSize; x += this.config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y < this.canvas.height + this.config.gridSize; y += this.config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    // Add some grid intersection dots for extra detail
    ctx.fillStyle = this.config.gridDotColor;
    for (let x = startX; x < this.canvas.width + this.config.gridSize; x += this.config.gridSize) {
      for (
        let y = startY;
        y < this.canvas.height + this.config.gridSize;
        y += this.config.gridSize
      ) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Draw twinkling stars
   */
  drawStars(ctx) {
    this.stars.forEach(star => {
      const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase);
      const alpha = star.brightness * twinkle;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * this.config.starAlphaMultiplier})`;
      ctx.shadowBlur = star.size * 2;
      ctx.shadowColor = '#fff';

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    });
  }

  /**
   * Draw moving scan lines
   */
  drawScanLines(ctx) {
    // Subtle horizontal scan lines that move
    const scanOffset = (this.time * this.config.scanLineSpeed) % (this.config.scanLineSpacing * 2);

    ctx.strokeStyle = this.config.scanLineColor;
    ctx.lineWidth = 1;

    for (
      let y = -scanOffset;
      y < this.canvas.height + this.config.scanLineSpacing;
      y += this.config.scanLineSpacing
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  /**
   * Handle canvas resize
   */
  resize() {
    // Regenerate stars when canvas resizes
    this.generateStars();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Regenerate stars if star count changed
    if (newConfig.starCount !== undefined) {
      this.generateStars();
    }
  }

  /**
   * Get current animation time
   */
  getTime() {
    return this.time;
  }

  /**
   * Reset animation time
   */
  resetTime() {
    this.time = 0;
  }
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundRenderer;
}
