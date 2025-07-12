/**
 * Main Renderer class that manages canvas context and coordinates rendering systems
 */
class Renderer {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.config = {
            clearColor: "rgba(0, 0, 0, 1)",
            ...config
        };
        
        // Rendering subsystems
        this.backgroundRenderer = null;
        this.effectsRenderer = null;
        this.uiRenderer = null;
        
        // Bind resize handler
        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.resize();
    }
    
    /**
     * Initialize renderer and subsystems
     */
    init(backgroundRenderer, effectsRenderer, uiRenderer) {
        this.backgroundRenderer = backgroundRenderer;
        this.effectsRenderer = effectsRenderer;
        this.uiRenderer = uiRenderer;
    }
    
    /**
     * Handle canvas resize
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Notify subsystems of resize
        if (this.backgroundRenderer && this.backgroundRenderer.resize) {
            this.backgroundRenderer.resize();
        }
        if (this.effectsRenderer && this.effectsRenderer.resize) {
            this.effectsRenderer.resize();
        }
        if (this.uiRenderer && this.uiRenderer.resize) {
            this.uiRenderer.resize();
        }
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Begin a new frame
     */
    beginFrame() {
        this.clear();
        
        // Set default canvas state
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.lineWidth = 1;
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
    }
    
    /**
     * End the current frame
     */
    endFrame() {
        // Reset any global state if needed
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Render the background
     */
    renderBackground(deltaTime) {
        if (this.backgroundRenderer) {
            this.backgroundRenderer.render(this.ctx, deltaTime);
        }
    }
    
    /**
     * Render game entities with standard drawing methods
     */
    renderEntities(entities) {
        if (!Array.isArray(entities)) {
            if (entities && entities.draw) {
                entities.draw(this.ctx);
            }
            return;
        }
        
        entities.forEach(entity => {
            if (entity && entity.draw) {
                entity.draw(this.ctx);
            }
        });
    }
    
    /**
     * Render visual effects (particles, trails, etc.)
     */
    renderEffects(effects, deltaTime) {
        if (this.effectsRenderer) {
            this.effectsRenderer.render(this.ctx, effects, deltaTime);
        }
    }
    
    /**
     * Render bomb effect
     */
    renderBombEffect(bombEffect) {
        if (bombEffect && bombEffect.draw) {
            bombEffect.draw(this.ctx);
        }
    }
    
    /**
     * Render UI elements
     */
    renderUI(gameState, uiData) {
        if (this.uiRenderer) {
            this.uiRenderer.render(this.ctx, gameState, uiData);
        }
    }
    
    /**
     * Render game over screen
     */
    renderGameOverScreen(score, highScore, isNewHighScore) {
        if (this.uiRenderer) {
            this.uiRenderer.renderGameOverScreen(this.ctx, this.canvas, score, highScore, isNewHighScore);
        }
    }
    
    /**
     * Render pause screen
     */
    renderPauseScreen() {
        if (this.uiRenderer) {
            this.uiRenderer.renderPauseScreen(this.ctx, this.canvas);
        }
    }
    
    /**
     * Set global alpha for transparency effects
     */
    setGlobalAlpha(alpha) {
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }
    
    /**
     * Save canvas state
     */
    save() {
        this.ctx.save();
    }
    
    /**
     * Restore canvas state
     */
    restore() {
        this.ctx.restore();
    }
    
    /**
     * Get canvas dimensions
     */
    getDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        window.removeEventListener("resize", this.resize);
    }
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}