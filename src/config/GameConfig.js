/**
 * Game Configuration Constants
 *
 * Central configuration file for all game constants and settings.
 * This file contains tunable parameters for gameplay, difficulty,
 * visual effects, and game mechanics.
 */

export const GameConfig = {
  // Player
  playerSpeed: 250,
  playerRadius: 10,
  fireRate: 0.15,
  bulletSpeed: 450,
  bulletRadius: 4,

  // Enemy
  enemyBaseRadius: 12,
  enemyBaseSpeed: 100,
  enemySpawnBaseInterval: 2.0,
  enemySpawnMinInterval: 0.3,
  enemySpawnIntervalDecay: 0.95, // Slower difficulty ramp

  // Scoring
  baseEnemyScore: 10,
  scoreMultiplierDecay: 500, // Points needed to increase difficulty

  // Visual
  particleCount: 16,
  particleLifetime: 0.6,
  particleMinSpeed: 50,
  particleMaxSpeed: 150,

  // Game
  startingLives: 3,
  invulnerabilityTime: 1.5, // Seconds of invulnerability after hit

  // Powerups
  powerupDropChance: 0.15, // 15% chance
  powerupDuration: 15, // seconds
  powerupSpeed: 60,

  // Bombs
  startingBombs: 3,
  maxBombs: 5
};

export default GameConfig;
