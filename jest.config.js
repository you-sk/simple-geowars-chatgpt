module.exports = {
  // テスト環境
  testEnvironment: 'jsdom',
  
  // テストファイルの検出
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // カバレッジ設定（一時的に無効化）
  collectCoverage: false,
  // coverageDirectory: 'coverage',
  // coverageReporters: ['text', 'lcov', 'html'],
  // collectCoverageFrom: [
  //   '*.js',
  //   '!jest.config.js',
  //   '!eslint.config.js',
  //   '!**/*.test.js',
  //   '!**/*.spec.js',
  //   '!tests/**/*'
  // ],
  
  // カバレッジ閾値（一時的に無効化）
  // coverageThreshold: {
  //   global: {
  //     branches: 30,
  //     functions: 30,
  //     lines: 30,
  //     statements: 30
  //   }
  // },
  
  // モック設定
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // モジュール解決
  moduleFileExtensions: ['js', 'json'],
  
  // 変換設定（必要に応じて）
  transform: {},
  
  // グローバル設定を削除（setupFilesAfterEnvで設定するため）
};