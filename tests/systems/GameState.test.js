import GameState from '../../src/systems/GameState.js';
import { GameConfig } from '../../src/config/GameConfig.js';

describe('GameState', () => {
  let gameState;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    };
    global.localStorage = mockLocalStorage;
    
    gameState = new GameState();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and reset', () => {
    it('should initialize with default values', () => {
      expect(gameState.state).toBe('playing');
      expect(gameState.score).toBe(0);
      expect(gameState.lives).toBe(GameConfig.startingLives);
      expect(gameState.bombs).toBe(GameConfig.startingBombs);
      expect(gameState.highScore).toBe(0);
      expect(gameState.comboCount).toBe(0);
      expect(gameState.comboTimer).toBe(0);
      expect(gameState.scoreMultiplier).toBe(1);
      expect(gameState.currentSpawnInterval).toBe(GameConfig.enemySpawnBaseInterval);
      expect(gameState.spawnTimer).toBe(0);
      expect(gameState.bombEffect).toBeNull();
    });

    it('should load high score from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('1000');
      
      gameState = new GameState();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('geoshooter-highscore');
      expect(gameState.highScore).toBe(1000);
    });

    it('should handle invalid localStorage value', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');
      
      gameState = new GameState();
      
      expect(gameState.highScore).toBe(0);
    });

    it('should reset all values when reset() is called', () => {
      // Modify some values
      gameState.score = 500;
      gameState.state = 'gameover';
      gameState.lives = 1;
      gameState.comboCount = 10;
      
      gameState.reset();
      
      expect(gameState.state).toBe('playing');
      expect(gameState.score).toBe(0);
      expect(gameState.lives).toBe(GameConfig.startingLives);
      expect(gameState.comboCount).toBe(0);
    });
  });

  describe('high score management', () => {
    it('should save new high score', () => {
      gameState.score = 1500;
      gameState.highScore = 1000;
      
      const isNewHighScore = gameState.saveHighScore();
      
      expect(isNewHighScore).toBe(true);
      expect(gameState.highScore).toBe(1500);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('geoshooter-highscore', '1500');
    });

    it('should not save if score is not higher', () => {
      gameState.score = 500;
      gameState.highScore = 1000;
      
      const isNewHighScore = gameState.saveHighScore();
      
      expect(isNewHighScore).toBe(false);
      expect(gameState.highScore).toBe(1000);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('difficulty system', () => {
    it('should calculate difficulty multiplier based on score', () => {
      gameState.score = 0;
      expect(gameState.getDifficultyMultiplier()).toBe(1);
      
      gameState.score = GameConfig.scoreMultiplierDecay;
      expect(gameState.getDifficultyMultiplier()).toBe(1.1);
      
      gameState.score = GameConfig.scoreMultiplierDecay * 5;
      expect(gameState.getDifficultyMultiplier()).toBe(1.5);
    });
  });

  describe('scoring and combo system', () => {
    it('should add score with base multiplier', () => {
      const points = gameState.addScore(100);
      
      expect(points).toBe(100);
      expect(gameState.score).toBe(100);
      expect(gameState.comboCount).toBe(1);
      expect(gameState.comboTimer).toBe(3.0);
      expect(gameState.scoreMultiplier).toBe(1);
    });

    it('should increase multiplier after 5 combo', () => {
      for (let i = 0; i < 5; i++) {
        gameState.addScore(10);
      }
      
      expect(gameState.comboCount).toBe(5);
      expect(gameState.scoreMultiplier).toBe(1.5);
    });

    it('should apply score multiplier', () => {
      // Build up combo
      for (let i = 0; i < 5; i++) {
        gameState.addScore(10);
      }
      
      const points = gameState.addScore(100);
      
      expect(points).toBe(150); // 100 * 1.5
      expect(gameState.score).toBe(205); // 55 (5*10 + 1*5) + 150
    });

    it('should reset combo timer on each score', () => {
      gameState.addScore(10);
      gameState.comboTimer = 1.5; // Simulate time passing
      
      gameState.addScore(10);
      
      expect(gameState.comboTimer).toBe(3.0);
    });
  });

  describe('combo timer update', () => {
    it('should decrease combo timer', () => {
      gameState.comboTimer = 3.0;
      
      gameState.updateComboTimer(0.5);
      
      expect(gameState.comboTimer).toBe(2.5);
    });

    it('should reset combo when timer expires', () => {
      gameState.comboCount = 10;
      gameState.scoreMultiplier = 2;
      gameState.comboTimer = 0.1;
      
      gameState.updateComboTimer(0.2);
      
      expect(gameState.comboTimer).toBeLessThanOrEqual(0);
      expect(gameState.comboCount).toBe(0);
      expect(gameState.scoreMultiplier).toBe(1);
    });

    it('should not update if timer is already 0', () => {
      gameState.comboTimer = 0;
      gameState.comboCount = 5;
      
      gameState.updateComboTimer(0.1);
      
      expect(gameState.comboCount).toBe(5); // Not reset
    });
  });

  describe('damage and lives', () => {
    it('should decrease lives on damage', () => {
      const initialLives = gameState.lives;
      
      const gameOver = gameState.takeDamage();
      
      expect(gameState.lives).toBe(initialLives - 1);
      expect(gameOver).toBe(false);
    });

    it('should trigger game over when lives reach 0', () => {
      gameState.lives = 1;
      
      const gameOver = gameState.takeDamage();
      
      expect(gameState.lives).toBe(0);
      expect(gameOver).toBe(true);
      expect(gameState.state).toBe('gameover');
    });
  });

  describe('bomb system', () => {
    it('should use bomb if available', () => {
      const initialBombs = gameState.bombs;
      
      const used = gameState.useBomb();
      
      expect(used).toBe(true);
      expect(gameState.bombs).toBe(initialBombs - 1);
    });

    it('should not use bomb if none available', () => {
      gameState.bombs = 0;
      
      const used = gameState.useBomb();
      
      expect(used).toBe(false);
      expect(gameState.bombs).toBe(0);
    });

    it('should not use bomb if effect is active', () => {
      gameState.bombEffect = { active: true };
      
      const used = gameState.useBomb();
      
      expect(used).toBe(false);
    });

    it('should add bomb up to max', () => {
      gameState.bombs = 2;
      
      const added = gameState.addBomb();
      
      expect(added).toBe(true);
      expect(gameState.bombs).toBe(3);
    });

    it('should not add bomb if at max', () => {
      gameState.bombs = GameConfig.maxBombs;
      
      const added = gameState.addBomb();
      
      expect(added).toBe(false);
      expect(gameState.bombs).toBe(GameConfig.maxBombs);
    });

    it('should manage bomb effect reference', () => {
      const effect = { type: 'bomb' };
      
      gameState.setBombEffect(effect);
      expect(gameState.bombEffect).toBe(effect);
      expect(gameState.isBombEffectActive()).toBe(true);
      
      gameState.clearBombEffect();
      expect(gameState.bombEffect).toBeNull();
      expect(gameState.isBombEffectActive()).toBe(false);
    });
  });

  describe('spawn timer', () => {
    it('should decrease spawn timer and return true when ready', () => {
      gameState.spawnTimer = 0.1;
      
      const shouldSpawn = gameState.updateSpawnTimer(0.2);
      
      expect(shouldSpawn).toBe(true);
      expect(gameState.spawnTimer).toBe(gameState.currentSpawnInterval);
    });

    it('should decrease spawn interval over time', () => {
      gameState.spawnTimer = 0.1;
      const initialInterval = gameState.currentSpawnInterval;
      
      gameState.updateSpawnTimer(0.2);
      
      expect(gameState.currentSpawnInterval).toBeLessThan(initialInterval);
      expect(gameState.currentSpawnInterval).toBe(
        initialInterval * GameConfig.enemySpawnIntervalDecay
      );
    });

    it('should not go below minimum spawn interval', () => {
      gameState.currentSpawnInterval = GameConfig.enemySpawnMinInterval;
      gameState.spawnTimer = 0.1;
      
      gameState.updateSpawnTimer(0.2);
      
      expect(gameState.currentSpawnInterval).toBe(GameConfig.enemySpawnMinInterval);
    });

    it('should return false when not ready to spawn', () => {
      gameState.spawnTimer = 1.0;
      
      const shouldSpawn = gameState.updateSpawnTimer(0.1);
      
      expect(shouldSpawn).toBe(false);
      expect(gameState.spawnTimer).toBe(0.9);
    });
  });

  describe('pause system', () => {
    it('should pause when playing', () => {
      gameState.state = 'playing';
      
      gameState.pause();
      
      expect(gameState.state).toBe('paused');
    });

    it('should not pause when not playing', () => {
      gameState.state = 'gameover';
      
      gameState.pause();
      
      expect(gameState.state).toBe('gameover');
    });

    it('should resume when paused', () => {
      gameState.state = 'paused';
      
      gameState.resume();
      
      expect(gameState.state).toBe('playing');
    });

    it('should not resume when not paused', () => {
      gameState.state = 'gameover';
      
      gameState.resume();
      
      expect(gameState.state).toBe('gameover');
    });

    it('should toggle pause state', () => {
      gameState.state = 'playing';
      
      gameState.togglePause();
      expect(gameState.state).toBe('paused');
      
      gameState.togglePause();
      expect(gameState.state).toBe('playing');
    });

    it('should not toggle from game over state', () => {
      gameState.state = 'gameover';
      
      gameState.togglePause();
      
      expect(gameState.state).toBe('gameover');
    });
  });

  describe('state checking methods', () => {
    it('should correctly check playing state', () => {
      gameState.state = 'playing';
      expect(gameState.isPlaying()).toBe(true);
      expect(gameState.isPaused()).toBe(false);
      expect(gameState.isGameOver()).toBe(false);
    });

    it('should correctly check paused state', () => {
      gameState.state = 'paused';
      expect(gameState.isPlaying()).toBe(false);
      expect(gameState.isPaused()).toBe(true);
      expect(gameState.isGameOver()).toBe(false);
    });

    it('should correctly check game over state', () => {
      gameState.state = 'gameover';
      expect(gameState.isPlaying()).toBe(false);
      expect(gameState.isPaused()).toBe(false);
      expect(gameState.isGameOver()).toBe(true);
    });

    it('should return current state', () => {
      gameState.state = 'playing';
      expect(gameState.getState()).toBe('playing');
      
      gameState.state = 'paused';
      expect(gameState.getState()).toBe('paused');
    });
  });

  describe('UI data', () => {
    it('should return complete UI data snapshot', () => {
      gameState.score = 1500;
      gameState.lives = 2;
      gameState.bombs = 4;
      gameState.highScore = 2000;
      gameState.comboCount = 7;
      gameState.scoreMultiplier = 1.5;
      gameState.state = 'playing';
      
      const uiData = gameState.getUIData();
      
      expect(uiData).toEqual({
        score: 1500,
        lives: 2,
        bombs: 4,
        highScore: 2000,
        comboCount: 7,
        scoreMultiplier: 1.5,
        difficultyMultiplier: gameState.getDifficultyMultiplier(),
        state: 'playing'
      });
    });
  });
});