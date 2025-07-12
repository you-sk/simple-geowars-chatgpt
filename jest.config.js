module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test file detection
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],

  // ES modules support with Babel
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/systems/BackgroundRenderer.js',
    '!src/systems/EffectsRenderer.js',
    '!src/systems/Renderer.js',
    '!src/systems/UIRenderer.js',
    '!jest.config.js',
    '!eslint.config.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!tests/**/*'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 40,
      lines: 50,
      statements: 50
    },
    'src/entities/*.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/config/*.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/systems/GameState.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module resolution
  moduleFileExtensions: ['js', 'json']
};
