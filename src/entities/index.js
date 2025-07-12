/**
 * Entity exports for easy importing
 */

// Import all entity classes
import Vec2 from './Vec2.js';
import Particle from './Particle.js';
import { Bullet, LaserBullet, Trail } from './Bullet.js';
import Enemy from './Enemy.js';
import Player from './Player.js';
import Powerup from './Powerup.js';

// Export all entities
export { Vec2, Particle, Bullet, LaserBullet, Trail, Enemy, Player, Powerup };

// Default export for convenience
export default {
  Vec2,
  Particle,
  Bullet,
  LaserBullet,
  Trail,
  Enemy,
  Player,
  Powerup
};
