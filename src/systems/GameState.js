import { GameConfig } from '../config/GameConfig.js';

/**
 * GameState Class
 *
 * Manages all game state variables, scoring, difficulty progression,
 * and state transitions (play, pause, game over).
 *
 * This class centralizes game state management and provides a clean
 * interface for state operations, making the code more testable and maintainable.
 */
export class GameState {
  constructor() {
    this.reset();
  }

  /**
   * Initialize/reset all game state variables to their starting values
   */
  reset() {
    // Core game state
    this.state = 'playing'; // "playing", "gameover", "paused"
    this.score = 0;
    this.lives = GameConfig.startingLives;
    this.bombs = GameConfig.startingBombs;

    // High score persistence
    this.highScore = 0;
    this.loadHighScore();

    // Combo system
    this.comboCount = 0;
    this.comboTimer = 0;
    this.scoreMultiplier = 1;

    // Enemy spawning and difficulty
    this.currentSpawnInterval = GameConfig.enemySpawnBaseInterval;
    this.spawnTimer = 0;

    // Special effects
    this.bombEffect = null;
  }

  /**
   * Load high score from localStorage
   */
  loadHighScore() {
    const saved = localStorage.getItem('geoshooter-highscore');
    if (saved) {
      this.highScore = parseInt(saved, 10) || 0;
    }
  }

  /**
   * Save high score to localStorage
   * @returns {boolean} true if a new high score was set
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('geoshooter-highscore', this.highScore.toString());
      return true; // New high score
    }
    return false;
  }

  /**
   * Calculate current difficulty multiplier based on score
   * @returns {number} difficulty multiplier
   */
  getDifficultyMultiplier() {
    // Smoother difficulty curve
    return 1 + Math.floor(this.score / GameConfig.scoreMultiplierDecay) * 0.1;
  }

  /**
   * Add points to the score and update combo system
   * @param {number} basePoints - base points to add
   * @returns {number} actual points added (including multiplier)
   */
  addScore(basePoints) {
    // Combo system
    this.comboCount++;
    this.comboTimer = 3.0; // Reset combo timer
    this.scoreMultiplier = 1 + Math.floor(this.comboCount / 5) * 0.5; // Increase multiplier every 5 combo

    const points = Math.floor(basePoints * this.scoreMultiplier);
    this.score += points;
    return points;
  }

  /**
   * Update combo timer - call this every frame with delta time
   * @param {number} dt - delta time in seconds
   */
  updateComboTimer(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.scoreMultiplier = 1;
      }
    }
  }

  /**
   * Handle player taking damage
   * @returns {boolean} true if game over, false otherwise
   */
  takeDamage() {
    this.lives--;
    if (this.lives <= 0) {
      this.state = 'gameover';
      return true;
    }
    return false;
  }

  /**
   * Use a bomb if available
   * @returns {boolean} true if bomb was used, false if none available
   */
  useBomb() {
    if (this.bombs <= 0 || this.bombEffect) {
      return false;
    }

    this.bombs--;
    return true;
  }

  /**
   * Add a bomb pickup if not at max capacity
   * @returns {boolean} true if bomb was added, false if at max capacity
   */
  addBomb() {
    if (this.bombs < GameConfig.maxBombs) {
      this.bombs++;
      return true;
    }
    return false;
  }

  /**
   * Update enemy spawn timing
   * @param {number} dt - delta time in seconds
   * @returns {boolean} true if an enemy should be spawned
   */
  updateSpawnTimer(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      // Gradually decrease spawn interval for increased difficulty
      this.currentSpawnInterval = Math.max(
        GameConfig.enemySpawnMinInterval,
        this.currentSpawnInterval * GameConfig.enemySpawnIntervalDecay
      );
      this.spawnTimer = this.currentSpawnInterval;
      return true;
    }
    return false;
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }

  /**
   * Resume the game from pause
   */
  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.state === 'playing') {
      this.pause();
    } else if (this.state === 'paused') {
      this.resume();
    }
  }

  /**
   * Check if the game is currently playing (not paused or game over)
   * @returns {boolean}
   */
  isPlaying() {
    return this.state === 'playing';
  }

  /**
   * Check if the game is paused
   * @returns {boolean}
   */
  isPaused() {
    return this.state === 'paused';
  }

  /**
   * Check if the game is over
   * @returns {boolean}
   */
  isGameOver() {
    return this.state === 'gameover';
  }

  /**
   * Get current game state
   * @returns {string} current state ("playing", "paused", "gameover")
   */
  getState() {
    return this.state;
  }

  /**
   * Get a snapshot of current game state for UI updates
   * @returns {object} state snapshot
   */
  getUIData() {
    return {
      score: this.score,
      lives: this.lives,
      bombs: this.bombs,
      highScore: this.highScore,
      comboCount: this.comboCount,
      scoreMultiplier: this.scoreMultiplier,
      difficultyMultiplier: this.getDifficultyMultiplier(),
      state: this.state
    };
  }

  /**
   * Set bomb effect reference for bomb cooldown management
   * @param {object} bombEffect - bomb effect object
   */
  setBombEffect(bombEffect) {
    this.bombEffect = bombEffect;
  }

  /**
   * Clear bomb effect reference
   */
  clearBombEffect() {
    this.bombEffect = null;
  }

  /**
   * Check if bomb effect is active
   * @returns {boolean}
   */
  isBombEffectActive() {
    return this.bombEffect !== null;
  }
}

export default GameState;
