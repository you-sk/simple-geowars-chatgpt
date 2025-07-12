# Contributing to GeoShooter

## 開発環境のセットアップ

### 必要なツール
- Node.js 16.0.0 以上
- モダンブラウザ（Chrome, Firefox, Edge, Safari）

### インストール
```bash
# リポジトリをクローン
git clone https://github.com/yourusername/geoshooter-twin-stick-arena.git
cd geoshooter-twin-stick-arena

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 開発ワークフロー

### 1. コード品質チェック
```bash
# リントチェック
npm run lint

# フォーマット
npm run format

# テスト実行
npm test

# 全体チェック
npm run validate
```

### 2. ブランチ戦略
- `main`: 安定版
- `develop`: 開発版
- `feature/機能名`: 新機能開発
- `fix/バグ名`: バグ修正
- `refactor/改善名`: リファクタリング

### 3. コミットメッセージ規約
```
type(scope): subject

body

footer
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

**例:**
```
feat(enemy): add boss enemy type

Add new boss enemy with multiple phases:
- Health system with 3 phases
- Different attack patterns per phase
- Special death animation

Closes #123
```

## コーディング規約

### 1. ファイル構成
```
src/
├── core/          # コアシステム
├── entities/      # ゲームエンティティ
├── systems/       # ゲームシステム
├── rendering/     # 描画関連
├── managers/      # 管理クラス
└── utils/         # ユーティリティ
```

### 2. 命名規則
- **クラス**: PascalCase (`EnemyManager`)
- **関数・変数**: camelCase (`updatePosition`)
- **定数**: UPPER_SNAKE_CASE (`MAX_ENEMIES`)
- **ファイル**: PascalCase (`EnemyManager.js`)

### 3. クラス設計原則
```javascript
// ❌ 悪い例: 責務が混在
class Player {
  update() {
    this.handleInput();
    this.updatePosition();
    this.checkCollisions();
    this.render();
  }
}

// ✅ 良い例: 単一責務
class Player {
  constructor() {
    this.position = new Vec2(0, 0);
    this.health = 100;
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health === 0;
  }
}

class PlayerInputHandler {
  handleInput(player, inputState) {
    // 入力処理のみ
  }
}
```

### 4. エラーハンドリング
```javascript
// 必須: 外部APIアクセス時のエラーハンドリング
function loadGameData() {
  try {
    const data = localStorage.getItem('gameData');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to load game data:', error);
    return getDefaultGameData();
  }
}

// 必須: ユーザー入力の検証
function setPlayerName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Player name must be a non-empty string');
  }
  // ...
}
```

## テスト指針

### 1. テスト種類
- **Unit Tests**: 個別関数・クラス
- **Integration Tests**: システム間連携
- **E2E Tests**: ユーザーシナリオ

### 2. テスト作成例
```javascript
// Vec2.test.js
import { Vec2 } from '../src/utils/Vec2.js';

describe('Vec2', () => {
  describe('constructor', () => {
    it('should create vector with given coordinates', () => {
      const vec = new Vec2(3, 4);
      expect(vec.x).toBe(3);
      expect(vec.y).toBe(4);
    });
  });

  describe('length', () => {
    it('should calculate correct length', () => {
      const vec = new Vec2(3, 4);
      expect(vec.len()).toBe(5);
    });
  });

  describe('normalize', () => {
    it('should return unit vector', () => {
      const vec = new Vec2(3, 4);
      const normalized = vec.norm();
      expect(normalized.len()).toBeCloseTo(1, 10);
    });

    it('should handle zero vector', () => {
      const vec = new Vec2(0, 0);
      const normalized = vec.norm();
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });
  });
});
```

### 3. カバレッジ目標
- 関数カバレッジ: 70%以上
- 行カバレッジ: 70%以上
- 分岐カバレッジ: 70%以上

## パフォーマンス指針

### 1. 最適化優先順位
1. **アルゴリズム効率**: O(n²) → O(n log n)
2. **メモリ使用量**: オブジェクトプール、再利用
3. **描画最適化**: 不要な再描画を避ける
4. **イベント処理**: デバウンス、スロットリング

### 2. パフォーマンス測定
```javascript
// パフォーマンス測定例
console.time('collision-detection');
const collisions = detectCollisions(bullets, enemies);
console.timeEnd('collision-detection');

// メモリ使用量チェック
console.log('Entities:', entities.length);
console.log('Particles:', particles.length);
```

## Pull Request指針

### 1. PR作成前チェックリスト
- [ ] `npm run validate` が通る
- [ ] 新機能にテストを追加
- [ ] ドキュメントを更新
- [ ] 破壊的変更がある場合はマイグレーションガイドを作成

### 2. PR説明テンプレート
```markdown
## 概要
この変更の概要を説明

## 変更内容
- 追加した機能
- 修正したバグ
- リファクタリング内容

## テスト
- 追加したテスト内容
- 動作確認方法

## スクリーンショット
（必要に応じて）

## Breaking Changes
（破壊的変更がある場合）

## Checklist
- [ ] テストが通る
- [ ] ドキュメントを更新
- [ ] リントエラーがない
```

## 質問・相談

- **Issue**: バグ報告、機能要求
- **Discussion**: 設計相談、アイデア提案
- **Discord**: リアルタイム相談（リンクがあれば）

貢献いただき、ありがとうございます！🎮