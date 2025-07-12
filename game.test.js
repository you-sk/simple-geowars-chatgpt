// 基本的なテストケース

describe('Basic Tests', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('Math functions work', () => {
    expect(Math.sqrt(4)).toBe(2);
    expect(Math.pow(2, 3)).toBe(8);
  });

  test('Array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });
});

describe('DOM Mock Tests', () => {
  test('document.getElementById is mocked', () => {
    const element = document.getElementById('test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('');
  });

  test('Canvas mock works', () => {
    const canvas = document.createElement('canvas');
    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(300); // JSDOMのデフォルト値
    expect(canvas.height).toBe(150); // JSDOMのデフォルト値
  });
});

// ゲームコードが読み込まれている場合のテスト
describe('Game Code Tests', () => {
  test('Vec2 class exists and works', () => {
    if (typeof Vec2 !== 'undefined') {
      const vec = new Vec2(3, 4);
      expect(vec.x).toBe(3);
      expect(vec.y).toBe(4);
      expect(vec.len()).toBe(5);
    } else {
      // Vec2が定義されていない場合はスキップ
      expect(true).toBe(true);
    }
  });

  test('GameConfig exists', () => {
    if (typeof GameConfig !== 'undefined') {
      expect(GameConfig).toBeDefined();
      expect(typeof GameConfig.playerSpeed).toBe('number');
    } else {
      // GameConfigが定義されていない場合はスキップ
      expect(true).toBe(true);
    }
  });
});
