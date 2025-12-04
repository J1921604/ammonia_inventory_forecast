# アンモニア在庫予測ダッシュボード - ローカル起動スクリプト
# 用途: ワンコマンドでローカル開発サーバーを起動し、ブラウザでlocalhost:3000を開く
# 実行方法: .\start-local.ps1

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " アンモニア在庫予測ダッシュボード " -ForegroundColor Cyan
Write-Host " ローカル開発環境起動中... " -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# プロジェクトルートに移動
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Node.jsバージョン確認
Write-Host "[1/4] Node.jsバージョン確認..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green

# npm依存関係確認
if (-Not (Test-Path "node_modules")) {
    Write-Host "[2/4] 依存関係をインストール中..." -ForegroundColor Yellow
    npm install
    Write-Host "  ✓ npm install 完了" -ForegroundColor Green
} else {
    Write-Host "[2/4] 依存関係確認済み" -ForegroundColor Yellow
    Write-Host "  ✓ node_modules 存在" -ForegroundColor Green
}

# Python環境確認（オプション）
Write-Host "[3/4] Python環境確認..." -ForegroundColor Yellow
try {
    $pythonVersion = py -3.10 --version 2>&1
    Write-Host "  ✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Python 3.10.11が見つかりません（AI機能は制限されます）" -ForegroundColor DarkYellow
}

# 開発サーバー起動
Write-Host "[4/4] 開発サーバー起動中..." -ForegroundColor Yellow
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host " 起動完了！ " -ForegroundColor Green
Write-Host " URL: http://localhost:3000 " -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ブラウザを自動的に開きます..." -ForegroundColor Cyan
Write-Host "終了するには Ctrl+C を押してください" -ForegroundColor DarkGray
Write-Host ""

# ブラウザを開く（バックグラウンド）
Start-Process "http://localhost:3000"

# 開発サーバー起動（フォアグラウンド）
npm run dev

# スクリプト終了時の処理
Write-Host ""
Write-Host "開発サーバーを停止しました" -ForegroundColor Yellow
Write-Host "ありがとうございました！" -ForegroundColor Cyan
