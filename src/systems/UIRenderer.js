/**
 * UIRenderer handles all user interface elements including:
 * - HUD (score, lives, bombs, combo)
 * - Game state screens (game over, pause)
 * - Powerup status display
 * - Difficulty indicators
 */
class UIRenderer {
    constructor(config = {}) {
        this.config = {
            hudFont: "12px monospace",
            titleFont: "48px sans-serif",
            subtitleFont: "24px sans-serif",
            bodyFont: "20px sans-serif",
            smallFont: "18px sans-serif",
            hudColor: "#fff",
            titleColor: "#f00",
            highlightColor: "#ff0",
            successColor: "#0f0",
            difficultyColor: "#666",
            overlayColor: "rgba(0,0,0,0.8)",
            pauseOverlayColor: "rgba(0,0,0,0.6)",
            powerupYStart: 30,
            powerupLineHeight: 15,
            ...config
        };
    }
    
    /**
     * Render main game UI elements
     */
    render(ctx, gameState, uiData) {
        if (gameState === "playing") {
            // Render HUD for playing state
            this.renderHUD(ctx, uiData);
        }
        // Note: Game over and pause screens are handled separately
        // through renderGameOverScreen() and renderPauseScreen()
    }
    
    /**
     * Render difficulty indicator in bottom left
     */
    renderDifficultyIndicator(ctx, uiData) {
        if (!uiData.difficultyMultiplier) return;
        
        ctx.fillStyle = this.config.difficultyColor;
        ctx.font = this.config.hudFont;
        ctx.textAlign = "left";
        ctx.fillText(
            `Difficulty: ${uiData.difficultyMultiplier.toFixed(1)}x`, 
            10, 
            ctx.canvas.height - 10
        );
    }
    
    /**
     * Render active powerup status
     */
    renderPowerupStatus(ctx, uiData) {
        if (!uiData.player || !uiData.player.powerups) return;
        
        let powerupY = this.config.powerupYStart;
        ctx.fillStyle = this.config.hudColor;
        ctx.font = this.config.hudFont;
        ctx.textAlign = "left";
        
        const powerups = uiData.player.powerups;
        
        if (powerups.triple > 0) {
            ctx.fillText(`Triple Shot: ${Math.ceil(powerups.triple)}s`, 10, powerupY);
            powerupY += this.config.powerupLineHeight;
        }
        if (powerups.laser > 0) {
            ctx.fillText(`Laser: ${Math.ceil(powerups.laser)}s`, 10, powerupY);
            powerupY += this.config.powerupLineHeight;
        }
        if (powerups.shield > 0) {
            ctx.fillText(`Shield: ${uiData.player.shieldHealth} hits`, 10, powerupY);
            powerupY += this.config.powerupLineHeight;
        }
    }
    
    /**
     * Render game over screen
     */
    renderGameOverScreen(ctx, canvas, score, highScore, isNewHighScore) {
        // Dark overlay
        ctx.fillStyle = this.config.overlayColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Main title
        ctx.fillStyle = this.config.titleColor;
        ctx.font = this.config.titleFont;
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);
        
        // Final score
        ctx.font = this.config.bodyFont;
        ctx.fillStyle = this.config.hudColor;
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
        
        // High score message
        if (isNewHighScore) {
            ctx.fillStyle = this.config.highlightColor;
            ctx.font = "bold 24px sans-serif";
            ctx.fillText("NEW HIGH SCORE!", canvas.width / 2, canvas.height / 2 + 10);
        } else {
            ctx.fillStyle = "#999";
            ctx.font = this.config.smallFont;
            ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 10);
        }
        
        // Restart instruction
        ctx.font = this.config.subtitleFont;
        ctx.fillStyle = this.config.successColor;
        ctx.fillText("Press R / Start to Restart", canvas.width / 2, canvas.height / 2 + 60);
    }
    
    /**
     * Render pause screen
     */
    renderPauseScreen(ctx, canvas) {
        // Semi-transparent overlay
        ctx.fillStyle = this.config.pauseOverlayColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Pause title
        ctx.fillStyle = this.config.successColor;
        ctx.font = this.config.titleFont;
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
        
        // Resume instruction
        ctx.font = this.config.subtitleFont;
        ctx.fillText("Press P / Select to Resume", canvas.width / 2, canvas.height / 2 + 40);
    }
    
    /**
     * Render combo indicator (used when combo count > 3)
     */
    renderCombo(ctx, comboCount, scoreMultiplier, position = null) {
        if (comboCount <= 3) return;
        
        const pos = position || { x: ctx.canvas.width - 150, y: 30 };
        
        ctx.fillStyle = this.config.highlightColor;
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`COMBO: ${comboCount}`, pos.x, pos.y);
        ctx.fillText(`${scoreMultiplier.toFixed(1)}x MULTIPLIER`, pos.x, pos.y + 20);
    }
    
    /**
     * Render bomb count indicator
     */
    renderBombCount(ctx, bombCount, position = null) {
        const pos = position || { x: ctx.canvas.width - 150, y: ctx.canvas.height - 30 };
        
        ctx.fillStyle = this.config.highlightColor;
        ctx.font = this.config.hudFont;
        ctx.textAlign = "right";
        ctx.fillText(`BOMBS: ${bombCount}`, pos.x, pos.y);
    }
    
    /**
     * Render player lives indicator
     */
    renderLives(ctx, lives, position = null) {
        const pos = position || { x: ctx.canvas.width - 150, y: ctx.canvas.height - 50 };
        
        ctx.fillStyle = this.config.successColor;
        ctx.font = this.config.hudFont;
        ctx.textAlign = "right";
        ctx.fillText(`LIVES: ${lives}`, pos.x, pos.y);
    }
    
    /**
     * Render score
     */
    renderScore(ctx, score, position = null) {
        const pos = position || { x: ctx.canvas.width - 150, y: 50 };
        
        ctx.fillStyle = this.config.hudColor;
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`SCORE: ${score}`, pos.x, pos.y);
    }
    
    /**
     * Render high score
     */
    renderHighScore(ctx, highScore, position = null) {
        const pos = position || { x: ctx.canvas.width - 150, y: 70 };
        
        ctx.fillStyle = "#999";
        ctx.font = this.config.hudFont;
        ctx.textAlign = "right";
        ctx.fillText(`HIGH: ${highScore}`, pos.x, pos.y);
    }
    
    /**
     * Render complete HUD with all elements
     */
    renderHUD(ctx, uiData) {
        // Score and high score
        this.renderScore(ctx, uiData.score);
        this.renderHighScore(ctx, uiData.highScore);
        
        // Lives and bombs
        this.renderLives(ctx, uiData.lives);
        this.renderBombCount(ctx, uiData.bombs);
        
        // Combo if active
        if (uiData.comboCount > 3) {
            this.renderCombo(ctx, uiData.comboCount, uiData.scoreMultiplier);
        }
        
        // Powerup status and difficulty
        this.renderPowerupStatus(ctx, uiData);
        this.renderDifficultyIndicator(ctx, uiData);
    }
    
    /**
     * Render text with glow effect
     */
    renderGlowText(ctx, text, x, y, color, glowColor, fontSize = "16px", fontFamily = "sans-serif") {
        ctx.font = `${fontSize} ${fontFamily}`;
        ctx.textAlign = "center";
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);
        
        // Main text
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }
    
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    /**
     * Handle resize events
     */
    resize() {
        // UI renderer doesn't need special resize handling
    }
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIRenderer;
}