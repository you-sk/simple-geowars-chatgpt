// Jest セットアップファイル

// DOM要素のモック（JSDOM環境では不要）
// JSDOMが提供するdocumentオブジェクトを使用

// 追加のメソッドのモック
if (typeof document !== 'undefined') {
  const originalGetElementById = document.getElementById;
  document.getElementById = jest.fn((id) => {
    const element = originalGetElementById.call(document, id);
    if (element) return element;
    // 存在しない要素の場合はモックを返す
    return {
      textContent: '',
      style: {},
      appendChild: jest.fn(),
      removeChild: jest.fn()
    };
  });
}

// Canvas API のモック
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  globalAlpha: 1,
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 }))
}));

// Web Audio API のモック
global.AudioContext = jest.fn(() => ({
  createBuffer: jest.fn(),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
    loop: false
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 }
  })),
  destination: {},
  sampleRate: 44100,
  state: 'running',
  resume: jest.fn(() => Promise.resolve())
}));

global.webkitAudioContext = global.AudioContext;

// Gamepad API のモック
Object.defineProperty(navigator, 'getGamepads', {
  value: jest.fn(() => []),
  writable: true
});

// localStorage のモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// localStorage のモック（JSDOMのwindowに追加）
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
}

// requestAnimationFrame のモック
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

// performance のモック
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now())
    },
    writable: true
  });
}

// イベントリスナーのモック
if (typeof window !== 'undefined') {
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();
}
if (typeof document !== 'undefined') {
  document.addEventListener = jest.fn();
  document.removeEventListener = jest.fn();
}

// テスト用のヘルパー関数
global.createMockCanvas = (width = 800, height = 600) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

global.createMockGamepad = (axes = [0, 0, 0, 0], buttons = []) => {
  return {
    axes,
    buttons: buttons.map(pressed => ({ pressed })),
    connected: true,
    index: 0
  };
};

// ゲームファイルを読み込む前に必要なグローバル変数を設定
if (typeof global.canvas === 'undefined') {
  global.canvas = {
    width: 800,
    height: 600,
    getContext: jest.fn(() => global.document.createElement('canvas').getContext())
  };
}

// ゲームファイルの読み込み（一時的に無効化）
// try {
//   // Node.js環境でファイルを読み込み、評価
//   const fs = require('fs');
//   const path = require('path');
//   
//   // audio.js を先に読み込み
//   const audioPath = path.join(__dirname, '..', 'audio.js');
//   if (fs.existsSync(audioPath)) {
//     const audioCode = fs.readFileSync(audioPath, 'utf8');
//     eval(audioCode);
//   }
//   
//   // game.js を読み込み
//   const gamePath = path.join(__dirname, '..', 'game.js');
//   if (fs.existsSync(gamePath)) {
//     const gameCode = fs.readFileSync(gamePath, 'utf8');
//     eval(gameCode);
//   }
// } catch (error) {
//   console.warn('Failed to load game files for testing:', error.message);
// }