
# アンモニア在庫レベル予測ダッシュボード - デプロイ手順書

このドキュメントでは、Next.jsアプリケーションをGitHub PagesとVercelにデプロイする手順を説明します。

## 📋 目次

1. [デプロイに必要なファイル](#デプロイに必要なファイル)
2. [前提条件](#前提条件)
3. [GitHub Pagesへのデプロイ](#github-pagesへのデプロイ)
4. [Vercelへのデプロイ](#vercelへのデプロイ)
5. [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
6. [データ更新手順](#データ更新手順)
7. [トラブルシューティング](#トラブルシューティング)

---

## デプロイに必要なファイル

### ✅ 必須ファイル（必ずアップロード）

```
ammonia_inventory_forecast/        ← 新規作成するフォルダ名
│
├── .github/
│   └── workflows/
│       ├── deploy.yml            ← GitHub Pages自動デプロイ
│       └── vercel.yml            ← Vercel自動デプロイ
│
├── app/
│   ├── layout.tsx                ← ルートレイアウト
│   ├── page.tsx                  ← メインダッシュボード
│   └── globals.css               ← スタイル
│
├── public/
│   ├── .nojekyll                 ← GitHub Pages用
│   └── data/
│       └── predictions.csv       ← 予測データ
│
├── .gitignore                    ← Git除外設定
├── next.config.js                ← Next.js設定
├── package.json                  ← 依存関係
├── package-lock.json             ← 依存関係ロックファイル(必須)
├── tsconfig.json                 ← TypeScript設定
├── vercel.json                   ← Vercel設定
└── README.md                     ← プロジェクト説明(オプション)
```

**合計**: 14ファイル(約8,000行)

### ❌ デプロイ不要なファイル（コピーしない・削除する）

| ファイル/フォルダ | 不要な理由 |
|---|---|
| `.next/` | ビルドキャッシュ。デプロイ先で自動生成される |
| `node_modules/` | npmパッケージ。`package.json`から自動インストールされる(200MB超) |
| `out/` | 静的エクスポート出力。GitHub Actionsが自動生成 |
| `next-env.d.ts` | TypeScript型定義。Next.jsが自動生成 |
| `COMPLETION_SUMMARY.md` | プロジェクト完成報告。デプロイに不要 |
| `DEPLOYMENT_GUIDE.md` | このファイル。デプロイに不要（参照用） |
| `PROJECT_STRUCTURE.md` | 構造説明書。デプロイに不要 |
| `QUICK_UPLOAD_GUIDE.md` | 手順書。デプロイに不要 |

---

## 前提条件

### 必要なアカウント
- GitHubアカウント（https://github.com/）
  - リポジトリ: `J1921604/ammonia_inventory_forecast`
- Vercelアカウント（https://vercel.com/）※Vercelにデプロイする場合のみ

### ローカル環境（ローカルテストする場合のみ）
- Node.js 20.x 以上
- Git

---

## GitHub Pagesへのデプロイ

### ステップ1: デプロイ用ファイルの準備

⚠️ **重要**: nextjs-deployフォルダ全体をコピーせず、**必要なファイルのみ**を選択してコピーします。これにより、不要なファイル（`node_modules`、`.next`等）を含めず、Obsidianリポジトリとの干渉も防ぎます。

#### 方法A: PowerShellスクリプトで自動コピー（推奨）

1. **PowerShellを開く**

2. **以下のスクリプトをコピー＆実行**

```powershell
# ===================================================
# Next.js デプロイファイル準備スクリプト
# ===================================================

# コピー元（nextjs-deployフォルダのパス）
$Source = "Obsidian\アンモニア在庫レベル予測\ammonia_inventory_forecast\nextjs-deploy"
# フルパスに変換
if (-not [System.IO.Path]::IsPathRooted($Source)) {
    $Source = Join-Path $env:USERPROFILE $Source
}

# コピー先（デスクトップに新規フォルダ作成）
$Dest = Join-Path $env:USERPROFILE "Desktop\ammonia_inventory_forecast"

# コピー先フォルダを作成
New-Item -Path $Dest -ItemType Directory -Force | Out-Null

Write-Host "📁 コピー元: $Source" -ForegroundColor Cyan
Write-Host "📁 コピー先: $Dest" -ForegroundColor Cyan
Write-Host ""

# 必要なフォルダをコピー
Write-Host "📂 フォルダをコピー中..." -ForegroundColor Yellow
Copy-Item "$Source\.github" -Destination "$Dest\.github" -Recurse -Force
Copy-Item "$Source\app" -Destination "$Dest\app" -Recurse -Force
Copy-Item "$Source\public" -Destination "$Dest\public" -Recurse -Force

# 必要なファイルをコピー
Write-Host "📄 ファイルをコピー中..." -ForegroundColor Yellow
Copy-Item "$Source\.gitignore" -Destination "$Dest\" -Force
Copy-Item "$Source\next.config.js" -Destination "$Dest\" -Force
Copy-Item "$Source\package.json" -Destination "$Dest\" -Force
Copy-Item "$Source\package-lock.json" -Destination "$Dest\" -Force
Copy-Item "$Source\tsconfig.json" -Destination "$Dest\" -Force
Copy-Item "$Source\vercel.json" -Destination "$Dest\" -Force

# オプション: README.mdもコピー
if (Test-Path "$Source\README.md") {
    Copy-Item "$Source\README.md" -Destination "$Dest\" -Force
}

Write-Host ""
Write-Host "✅ 必要なファイルのコピーが完了しました" -ForegroundColor Green
Write-Host ""
Write-Host "📋 コピーされたファイル:" -ForegroundColor Cyan
Get-ChildItem -Path $Dest -Recurse -File | Select-Object FullName | ForEach-Object {
    $relativePath = $_.FullName.Replace($Dest, "")
    Write-Host "  $relativePath" -ForegroundColor Gray
}
Write-Host ""
Write-Host "🚀 次のステップ: GitHubリポジトリを作成してプッシュ" -ForegroundColor Green
```
```powershell
explorer.exe "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"
```

#### 方法B: 手動でコピー

1. デスクトップに `ammonia_inventory_forecast` フォルダを作成
2. 以下のフォルダ・ファイルのみをコピー：
   - `.github` フォルダ全体
   - `app` フォルダ全体
   - `public` フォルダ全体
   - `.gitignore`
   - `next.config.js`
   - `package.json`
   - `package-lock.json`
   - `tsconfig.json`
   - `vercel.json`
   - `README.md`(オプション)

3. **コピーしないもの**:
   - ❌ `node_modules` フォルダ
   - ❌ `.next` フォルダ
   - ❌ `out` フォルダ
   - ❌ `next-env.d.ts`
   - ❌ `package-lock.json`
   - ❌ `*.md`ファイル（README.md以外）

#### コピー確認チェックリスト

エクスプローラーでコピー先フォルダを開き、確認：

- ✅ `.github/workflows/deploy.yml` がある
- ✅ `app/page.tsx` がある
- ✅ `public/data/predictions.csv` がある
- ✅ `package.json` がある
- ✅ `package-lock.json` がある
- ❌ `node_modules` フォルダがない
- ❌ `.next` フォルダがない
- ❌ `COMPLETION_SUMMARY.md` がない

---

### ステップ2: GitHubリポジトリの作成

1. **GitHubにログイン**
   - https://github.com/ にアクセス
   - J1921604 アカウントでログイン

2. **新しいリポジトリを作成**
   - 右上の「+」→「New repository」をクリック
   - Repository name: `ammonia_inventory_forecast`
   - Description: `アンモニア在庫レベル予測ダッシュボード`
   - Public を選択
   - **「Initialize this repository with」は何もチェックしない**
   - 「Create repository」をクリック

3. **リポジトリURLを確認**
   - https://github.com/J1921604/ammonia_inventory_forecast.git

---

### ステップ3: ローカルファイルをGitHubにプッシュ

#### 選択肢A: GitHub CLI で認証してプッシュ（推奨・安全）

**方法**: GitHub CLI でブラウザ認証を行い、正しいアカウントで push します。

**前提**: GitHub CLI (`gh`) がインストールされている必要があります。
- インストール確認: PowerShell で `gh --version` を実行
- インストールされていない場合: https://cli.github.com/ からダウンロード

**手順**（PowerShell）:

```powershell
# 1. 現在の認証状態を確認
gh auth status --hostname github.com

# 2. ブラウザ経由で再ログイン（J1921604 アカウントでサインイン）
gh auth login --hostname github.com --web

# 3. 認証後の確認（Active account が J1921604 になっていることを確認）
gh auth status --hostname github.com

# 4. コピー先フォルダに移動
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"

# 5. Gitリポジトリとして初期化
git init

# 6. すべてのファイルをステージング
git add .

# 7. 初回コミット
git commit -m "Initial commit: Next.js dashboard"

# 8. リモートリポジトリを追加
git remote add origin https://github.com/J1921604/ammonia_inventory_forecast.git

# 9. リモートリポジトリを確認（重要！）
git remote -v
# 期待される出力:
# origin  https://github.com/J1921604/ammonia_inventory_forecast.git (fetch)
# origin  https://github.com/J1921604/ammonia_inventory_forecast.git (push)

# 10. mainブランチにプッシュ
git branch -M main
git push -u origin main
```

**メリット**:
- ブラウザで 2FA（二要素認証）を含む完全な認証が可能
- 複数アカウントを持っている場合でも安全に切り替え可能
- Personal Access Token (PAT) を手動で作成・管理する必要がない

---

#### 選択肢B: Git HTTPS で直接プッシュ

PowerShellを開き、コピー先フォルダに移動してGit操作を実行：

```powershell
# 1. コピー先フォルダに移動
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"

# 2. Gitリポジトリとして初期化
git init

# 3. すべてのファイルをステージング
git add .

# 4. 初回コミット
git commit -m "Initial commit: Next.js dashboard"

# 5. リモートリポジトリを追加
git remote add origin https://github.com/J1921604/ammonia_inventory_forecast.git

# 6. リモートリポジトリを確認（重要！）
git remote -v
# 期待される出力:
# origin  https://github.com/J1921604/ammonia_inventory_forecast.git (fetch)
# origin  https://github.com/J1921604/ammonia_inventory_forecast.git (push)

# 7. mainブランチにプッシュ
git branch -M main
git push -u origin main
```

---

**プッシュ後の確認**

ブラウザで https://github.com/J1921604/ammonia_inventory_forecast を開き、確認：
- ✅ `app` フォルダが存在する
- ✅ `public/data/predictions.csv` が存在する
- ✅ `package.json` が存在する
- ✅ `.github/workflows/deploy.yml` が存在する

---

### ステップ4: GitHub Pagesの有効化

1. **リポジトリ設定にアクセス**
   - https://github.com/J1921604/ammonia_inventory_forecast
   - 「Settings」タブをクリック

2. **Pagesを設定**
   - 左メニューから「Pages」を選択
   - Source: **「GitHub Actions」を選択**
   - Save

3. **自動デプロイの開始**
   - 「Actions」タブをクリック
   - 「Deploy Next.js site to Pages」ワークフローが自動実行される
   - 緑のチェックマークが表示されれば成功

4. **デプロイされたサイトにアクセス**
   - 約5-10分後にアクセス可能
   - URL: `https://j1921604.github.io/ammonia_inventory_forecast/`

---

## Vercelへのデプロイ

### 方法1: Vercel CLI（推奨）

1. **Vercel CLIのインストール**

```powershell
npm install -g vercel
```

2. **ログイン**

```powershell
vercel login
```

3. **デプロイ先フォルダに移動**

```powershell
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"
```

4. **初回デプロイ**

```powershell
vercel
```

質問に答える:
- Set up and deploy: `Y`
- Which scope: 自分のアカウントを選択
- Link to existing project: `N`
- Project name: `ammonia-inventory-forecast`
- In which directory: `./` (そのままEnter)
- Override settings: `N`

5. **本番環境にデプロイ**

```powershell
vercel --prod
```

6. **デプロイされたサイトにアクセス**
   - URL: `https://ammonia-inventory-forecast.vercel.app`
   - または表示されたURLをブラウザで開く

### 方法2: Vercel Webダッシュボード

1. **Vercelにログイン**
   - https://vercel.com にアクセス

2. **GitHubリポジトリをインポート**
   - 「Add New」→「Project」をクリック
   - 「Import Git Repository」を選択
   - `J1921604/ammonia_inventory_forecast` を検索して選択
   - 「Import」をクリック

3. **プロジェクト設定**
   - Framework Preset: **Next.js**（自動検出される）
   - Root Directory: `./` (デフォルト)
   - Build Command: `npm run build`（デフォルト）
   - Output Directory: `.next`（デフォルト）
   - 「Deploy」をクリック

4. **デプロイ完了**
   - 約2-3分で完了
   - URLが表示される

---

## ローカル開発環境のセットアップ

ローカルでテストする場合のみ実行：

### 1. 依存関係のインストール

```powershell
# デプロイ用フォルダに移動
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"

# npmパッケージをインストール
npm install
```

**所要時間**: 約2-5分  
**インストールされるパッケージ**: 339個（約200-300MB）

### 2. 開発サーバーの起動

```powershell
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

### 3. ビルドテスト（オプション）

```powershell
# 本番ビルド
npm run build

# 静的エクスポート
npm run export
```

**ビルド結果**:
- `.next/` フォルダに最適化ファイルが生成される
- `out/` フォルダに静的HTMLが生成される（exportの場合）

**注意**: これらのフォルダ（`.next`、`out`）はGitにコミットする必要はありません（`.gitignore`で除外済み）

---

## データ更新手順

### predictions.csvを更新する場合

1. **新しいCSVファイルを準備**
   - ファイル名: `predictions.csv`
   - 形式: 元のCSVと同じ列構成

2. **ローカルで更新**

```powershell
# デプロイ用フォルダに移動
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"

# CSVファイルを上書き（新しいCSVファイルのパスを指定）
Copy-Item "新しいCSVファイルのパス\predictions.csv" -Destination "public\data\predictions.csv" -Force

# 変更をコミット
git add public/data/predictions.csv
git commit -m "Update predictions data"
git push
```

3. **自動デプロイ**
   - GitHub Actionsが自動的に再デプロイ（約5-10分）
   - Vercelも自動的に再デプロイ（約2-3分）

---

## トラブルシューティング

### GitHub Pages

#### 問題: 404エラーが表示される

**原因**: basePath設定の問題

**解決方法**:
1. `next.config.js`を確認
   ```javascript
   basePath: '/ammonia_inventory_forecast'
   ```
2. リポジトリ名と一致していることを確認

#### 問題: CSSが適用されない

**原因**: assetPrefix設定の問題

**解決方法**:
1. `next.config.js`を確認
   ```javascript
   assetPrefix: '/ammonia_inventory_forecast/'
   ```
2. 末尾のスラッシュに注意

#### 問題: CSVデータが読み込めない

**原因**: ファイルパスの問題

**解決方法**:
1. `app/page.tsx`の該当箇所を確認
   ```typescript
   const basePath = process.env.NODE_ENV === 'production' 
     ? '/ammonia_inventory_forecast' 
     : ''
   ```
2. `public/data/predictions.csv`が存在することを確認

### Vercel

#### 問題: ビルドエラー

**原因**: Node.jsバージョンの不一致

**解決方法**:
1. Vercelダッシュボード → Settings → General
2. Node.js Version: `20.x` を選択
3. Save

### 共通の問題

#### 問題: Chart.jsが表示されない

**解決方法**:
1. ブラウザのコンソールでエラーを確認
2. `npm install`を再実行
3. ブラウザのキャッシュをクリア

#### 問題: TypeScriptエラー

**解決方法**:
```powershell
# 型定義を再インストール
npm install --save-dev @types/node @types/react @types/react-dom
```

#### 問題: GitHubプッシュ時に認証エラー

**解決方法**:
```powershell
# Personal Access Tokenを使用
# GitHubで Settings → Developer settings → Personal access tokens → Generate new token
# repo権限を付与して生成
# パスワードの代わりにトークンを使用
```

---

## 更新手順のまとめ

### コードを更新してデプロイする場合

**最終更新**: 2025-10-27  
**バージョン**: 2.0.0 - 簡潔化・安全性向上版

```powershell
# 1. デプロイ用フォルダに移動
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"

# 2. ファイルを編集（VSCodeなどで）

# 3. 変更をコミット＆プッシュ
git add .
git commit -m "Update: 変更内容の説明"
git push

# 4. 自動デプロイが開始される（GitHub Actions & Vercel）
```

### データのみを更新する場合

```powershell
# 1. デプロイ用フォルダに移動
cd "$env:USERPROFILE\Desktop\ammonia_inventory_forecast"

# 2. CSVファイルを更新
Copy-Item "新しいCSVのパス" -Destination "public\data\predictions.csv" -Force

# 3. コミット＆プッシュ
git add public/data/predictions.csv
git commit -m "Update predictions data"
git push
```

---

**最終更新**: 2025-10-27  
**バージョン**: 2.0.0 - 簡潔化・安全性向上版
