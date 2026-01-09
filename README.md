# アンモニア在庫レベル予測ダッシュボード

Next.js 14で構築されたアンモニア在庫レベル予測ダッシュボードです。

**バージョン**: 1.0.0  
**リリース日**: 2025年12月5日  
**最終更新**: 2025年12月5日  
**リポジトリ**: https://github.com/J1921604/ammonia_inventory_forecast

[![Deploy to GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen)](https://j1921604.github.io/ammonia_inventory_forecast/)
[![GitHub Actions](https://github.com/J1921604/ammonia_inventory_forecast/workflows/Deploy%20Ammonia%20Inventory%20Forecast%20to%20GitHub%20Pages/badge.svg)](https://github.com/J1921604/ammonia_inventory_forecast/actions)

## 🚀 デモサイト

- **GitHub Pages**: https://j1921604.github.io/ammonia_inventory_forecast/
- **GitHub リポジトリ**: https://github.com/J1921604/ammonia_inventory_forecast

## 📚 ドキュメント

- **[機能仕様書](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/specs/001-ammonia_inventory_forecast/spec.md)** - 詳細な機能要件とユーザーストーリー
- **[実装計画](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/specs/001-ammonia_inventory_forecast/plan.md)** - 技術設計とスケジュール
- **[タスク詳細](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/specs/001-ammonia_inventory_forecast/tasks.md)** - 実装タスクとチェックリスト
- **[完全仕様書](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/docs/完全仕様書.md)** - システム全体の技術仕様
- **[デプロイガイド](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/docs/DEPLOY_GUIDE.md)** - GitHub Pages デプロイ手順

## 📋 機能

### コア機能

- 📊 **インタラクティブなチャート**: Chart.js を使用したリアルタイムグラフ
- 📅 **日付範囲選択**: 基準日を中心に過去・未来のデータを表示
- 🔔 **補充警告システム**: 在庫レベルが閾値を下回る予測を自動検出
- 📈 **統計情報**: R²、平均誤差、次回補充推奨日など

### データ管理機能

- 💾 **CSV インポート/エクスポート**: `training_data.csv` のアップロード・ダウンロード機能（ローカル環境のみ）
- 🤖 **自動データ補完**: 前日までのデータが無い場合、前年同日から自動コピーして学習に使用
- ⚡ **GitHub Actions 自動デプロイ**: 毎日 JST 07:00 に自動更新

### AI予測機能

- 🧠 **学習ボタン**: `/api/ml/train` で backend/ai_pipeline/src/train.py を実行し、全履歴から再学習（ローカル環境のみ）
- 🔮 **予測ボタン**: `/api/ml/predict` で backend/ai_pipeline/src/predict.py を実行し、前日までを自動補完 + 1か月先まで推論（ローカル環境のみ）
- ⚡ **GitHub Actions 連携**: 每日 JST 07:00 に同じ Python パイプラインを実行し、`backend/ai_pipeline/data/predictions.csv` を自動更新

> **Note**: 学習・予測・インポート機能はローカル環境（localhost）でのみ利用可能です。GitHub Pages 上ではこれらのボタンは無効化され、警告が表示されます。

### UI/UX

- 🌙 **ダークモード**: ネオングラデーション UI
- 📱 **レスポンシブ**: モバイル・タブレット・デスクトップ対応

## 🛠️ 技術スタック

### フロントエンド（Next.js）

- **Next.js 14** (App Router)
- **TypeScript**
- **React 18**
- **Chart.js 4.4.1** + react-chartjs-2 5.2.0

### AI予測エンジン（Python）

`backend/ai_pipeline` ディレクトリ内に高精度なAI予測システムが含まれています：

- **機械学習**: RandomForest、GradientBoosting、Ridge回帰のアンサンブル
- **特徴量エンジニアリング**: 37項目（動的物理特徴量、時系列、ラグ、統計）
- **動的消費量率**: 発電量に基づく物理ベース予測（例：0.020884 m³/MWh）
- **高精度**: MAE=0.98 m³, R²=0.9998（Ridge回帰）

#### backend/ai_pipeline ディレクトリ構成

```
backend/ai_pipeline/
├── data/                   # training_data.csv / predictions.csv（正本）
├── models/                 # 学習済みモデル（.gitignore）
├── requirements.txt        # Python依存関係
└── src/
   ├── prepare_data.py     # 前年同日コピーで欠損を補完
   ├── train.py            # 全履歴で再学習
   ├── predict.py          # 30日先まで推論
   └── run_full_system.py  # データ補完 → 学習 → 予測の一括実行
```

#### 主要スクリプトの役割

| スクリプト | 役割 |
| --- | --- |
| `prepare_data.py` | `training_data.csv` を読み込み、前日までの不足日を前年同日からコピーし `actual_power` と `actual_ammonia` を補完します。 |
| `train.py` | 欠損処理済みの全履歴を使い、アンサンブル学習モデルを更新します。 |
| `predict.py` | 学習済みモデルを用い、30日先までの在庫レベルを推論し `data/predictions.csv` に出力します。 |
| `run_full_system.py` | `prepare_data → train → predict` を一括実行します。GitHub Actions からもこのフローが呼ばれます。 |

#### training_data.csv インポート → GitHub Actions 実行手順

1. `app` の「インポート」ボタン、または `app/api/data/import` で `training_data.csv` をアップロードすると、`backend/ai_pipeline/data/training_data.csv` に保存され、直後に `prepare_data.py` が実行されます。
2. 変更を Git でコミットし、`main` ブランチへプッシュします（例: `git add backend/ai_pipeline/data/training_data.csv`）。
3. プッシュ、または GitHub Actions の手動実行（Actions → Deploy Workflow → Run workflow）によって、CI が `prepare_data.py` と `run_full_system.py` を再実行し、最新の予測値をビルドへ反映します。

> 🔒 GitHub Actions をローカルAPIから直接起動することは GitHub のセキュリティ制約上できないため、**コミット＆プッシュ**または **手動トリガー**が必須です。この制約理由を README / ドキュメントに明記しています。

#### ローカル限定機能

- 学習・予測・インポート・エクスポートボタンは **localhost / 127.0.0.1** でのみアクティブです。
- GitHub Pages (https://j1921604.github.io/ammonia_inventory_forecast/) では、これらのボタンは自動的に無効化され、警告ポップアップで理由を示します。
- 必要に応じて `npm run dev` でローカルサーバーを起動し、ブラウザから操作してください。

## 📦 プロジェクト構成

```
ammonia_inventory_forecast/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # GitHub Pages 自動デプロイ設定
├── backend/
│   └── ai_pipeline/          # Python製 AI パイプライン
│       ├── src/              # train/predict/preprocess/prepare_data 等
│       ├── data/             # training_data.csv / predictions.csv
│       └── requirements.txt  # pip 依存関係
├── docs/
│   ├── DEPLOY_GUIDE.md       # デプロイ完全ガイド
│   └── 完全仕様書.md         # 完全仕様書
├── app/
│   ├── api/                  # APIルート (ml/train, ml/predict, data/import, data/export, data/predictions)
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # メインダッシュボード
│   └── globals.css           # グローバルスタイル
├── next.config.js            # Next.js 設定
├── package.json              # 依存関係
├── package-lock.json         # 依存関係ロックファイル
├── tsconfig.json             # TypeScript 設定
└── README.md                 # このファイル
```

## 🚀 クイックスタート

### 前提条件

- Node.js 20.x 以上
- npm または yarn

### ローカル開発

1. **リポジトリのクローン**

```bash
git clone https://github.com/J1921604/ammonia_inventory_forecast.git
cd ammonia_inventory_forecast
```

2. **依存関係のインストール**

```bash
npm install
```

3. **開発サーバーの起動**

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### AIパイプライン（任意）

ローカルで学習・予測を実行する場合は **Python 3.10.11** と pip が必要です。

```bash
cd backend/ai_pipeline
py -3.10 -m pip install --upgrade pip
py -3.10 -m pip install -r requirements.txt
py -3.10 src/run_full_system.py  # 学習 → 予測
```

**実行コマンド**: 本プロジェクトの標準実行環境はPython 3.10.11です。`py -3.10`コマンドで実行してください。

Next.js の API ルートから Python を呼び出す際にカスタムパスが必要な場合は、`PYTHON_EXECUTABLE` 環境変数に利用したい実行ファイル（例: `py -3.10` や `C:\Python310\python.exe`）を設定してください。

### ビルド

```bash
# 本番ビルド（静的ファイルは自動的にoutディレクトリへ生成されます）
npm run build
```

## 📍 デプロイ手順

詳細なデプロイ手順は **[docs/DEPLOY_GUIDE.md](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/docs/DEPLOY_GUIDE.md)** を参照してください。

### GitHub Pagesへのデプロイ（簡易版）

1. **必要なファイルをコピー**

   PowerShellで実行：

   ```powershell
   # コピー元（環境に合わせて変更）
   $Source = "C:\path\to\ammonia_inventory_forecast"
   $Dest = Join-Path $env:USERPROFILE "Desktop\ammonia_inventory_forecast"
   
   # フォルダ作成
   New-Item -Path $Dest -ItemType Directory -Force | Out-Null
   
   # 必要なフォルダをコピー
   Copy-Item "$Source\.github" -Destination "$Dest\.github" -Recurse -Force
   Copy-Item "$Source\app" -Destination "$Dest\app" -Recurse -Force
   Copy-Item "$Source\public" -Destination "$Dest\public" -Recurse -Force
   
   # 必要なファイルをコピー
   Copy-Item "$Source\.gitignore" -Destination "$Dest\" -Force
   Copy-Item "$Source\next.config.js" -Destination "$Dest\" -Force
   Copy-Item "$Source\package.json" -Destination "$Dest\" -Force
   Copy-Item "$Source\package-lock.json" -Destination "$Dest\" -Force
   Copy-Item "$Source\tsconfig.json" -Destination "$Dest\" -Force
   ```

2. **GitHubにプッシュ**

   ```powershell
   cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/J1921604/ammonia_inventory_forecast.git
   git branch -M main
   git push -u origin main
   ```

3. **GitHub Pagesを有効化**
   - リポジトリ → Settings → Pages
   - Source → **GitHub Actions**

### Vercelへのデプロイ（簡易版）

```powershell
npm install -g vercel
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"
vercel login
vercel
vercel --prod
```

## 📊 データ形式

`backend/ai_pipeline/data/predictions.csv`:

```csv
date,actual_power,actual_ammonia,is_refill,predicted_ammonia,prediction_error,prediction_error_pct
2024-10-01 09:00:00,537297.1361,783.4997603,0,783.4997603,0.0,0.0
```

### カラム説明

- `date`: 日時（YYYY-MM-DD HH:MM:SS）
- `actual_power`: 実績発電量 (kW)
- `actual_ammonia`: 実績在庫レベル (m³)
- `is_refill`: 補充フラグ (0 or 1)
- `predicted_ammonia`: 予測在庫レベル (m³)
- `prediction_error`: 予測誤差 (m³)
- `prediction_error_pct`: 予測誤差率 (%)

## 🎨 カスタマイズ

### 補充レベルの変更

`app/page.tsx`:

```typescript
const [refillLevel, setRefillLevel] = useState<number>(600) // 初期値を変更
```

### 表示期間の変更

```typescript
const [currentRange] = useState<number>(30) // 前後30日 → 変更可能
```

### カラースキーム

`app/globals.css`:

```css
.title {
  background: linear-gradient(45deg, #00ffff, #00ff88, #ff00ff);
}
```

## 🐛 トラブルシューティング

### GitHub Pagesで404エラー

- `next.config.js`の`basePath`がリポジトリ名と一致しているか確認
- `assetPrefix`の末尾に`/`があるか確認

### CSVデータが読み込めない

- `backend/ai_pipeline/data/predictions.csv`が存在するか確認
- APIルート `/api/data/predictions` が正しく動作しているか確認
- `app/page.tsx`のbasePath設定を確認

### Chart.jsが表示されない

```bash
# 依存関係を再インストール
npm install
```

詳細は [docs/DEPLOY_GUIDE.md](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/docs/DEPLOY_GUIDE.md) のトラブルシューティングセクションを参照。

## 🎨 実装機能の詳細

### チャート表示機能
- ✅ Chart.js統合による高度なグラフ表示
- ✅ 実績在庫レベル（青緑ライン）
- ✅ 予測在庫レベル（緑ライン、破線）
- ✅ 補充レベル（ピンクライン、破線）
- ✅ 発電実績（オレンジライン、右軸）
- ✅ インタラクティブなツールチップ
- ✅ 基準日の赤い縦線表示（カスタムプラグイン）
- ✅ 基準日のラベルを赤字表示
- ✅ 基準日に「基準日」テキスト追加

### コントロール機能
- ✅ 基準日選択（日付入力）
- ✅ 日付ナビゲーション（-7日、-1日、+1日、+7日）
- ✅ 年月ボタン（動的生成、アクティブハイライト）
- ✅ 補充レベル設定（-10、+10ボタン、手動入力）
- ✅ CSV インポート/エクスポート（データ管理パネル）

### 警告システム
- ✅ 補充警告（在庫レベルが閾値を下回る予測）
- ✅ パルスアニメーション（警告時）
- ✅ データ範囲超過警告

### 統計情報
- ✅ 基準日の在庫レベル
- ✅ 予測精度（R²スコア）
- ✅ 平均予測誤差
- ✅ 次回補充推奨日

## 🚀 デプロイオプション

### GitHub Pages（推奨）
- **URL**: https://j1921604.github.io/ammonia_inventory_forecast/
- **特徴**: 完全無料、自動デプロイ、静的サイト生成
- **更新頻度**: 毎日 JST 07:00 自動更新

### Vercel（オプション）
- **URL**: https://ammonia-inventory-forecast.vercel.app
- **特徴**: 高速CDN、自動プレビュー、最適化ビルド

## 📚 ドキュメント

- [完全仕様書](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/docs/完全仕様書.md)
- [デプロイガイド](https://github.com/J1921604/ammonia_inventory_forecast/blob/main/docs/DEPLOY_GUIDE.md)

## 📝 ライセンス

MIT License

## 👥 貢献

プルリクエストを歓迎します！

## 📧 サポート

問題が発生した場合は、[GitHub Issues](https://github.com/J1921604/ammonia_inventory_forecast/issues) で報告してください。

---
