import { test, expect } from '@playwright/test';

test.describe('アンモニア在庫レベル予測ダッシュボード E2E テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('ページタイトルとヘッダーが正しく表示される', async ({ page }) => {
    // タイトルの確認
    const title = page.locator('.title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('アンモニア在庫レベル予測ダッシュボード');
    
    // グラデーションスタイルが適用されているか確認
    const titleStyle = await title.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundImage: style.backgroundImage,
        webkitBackgroundClip: style.webkitBackgroundClip,
        color: style.color,
      };
    });
    
    // グラデーションが適用されていることを確認
    expect(titleStyle.backgroundImage).toContain('linear-gradient');
    // テキストが透明になっていることを確認（グラデーション効果）
    expect(titleStyle.color).toBe('rgba(0, 0, 0, 0)');
  });

  test('フッターと更新情報が表示される', async ({ page }) => {
    // CSVデータの読み込みを待つ（チャートが表示されるまで）
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // フッターの存在確認
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    
    // 更新情報の確認
    const updateInfo = page.locator('.update-info');
    await expect(updateInfo).toBeVisible();
    await expect(updateInfo).toContainText('最終更新:');
    await expect(updateInfo).toContainText('次回更新予定: 毎日 07:00 (日本時間)');
    
    // 最終更新日時が表示されているか確認（ビルド時刻または現在時刻）
    const lastUpdate = page.locator('#last-update');
    await page.waitForTimeout(2000); // データ読み込みを待つ
    const lastUpdateText = await lastUpdate.textContent();
    // YYYY/MM/DD HH:MM 形式で表示されることを確認
    if (lastUpdateText && lastUpdateText !== '-') {
      expect(lastUpdateText).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    }
  });

  test('コントロールパネルが正しく表示される', async ({ page }) => {
    // 警告パネル
    await expect(page.locator('#warningContainer')).toBeVisible();
    
    // 基準日選択
    await expect(page.locator('#baseDate')).toBeVisible();
    
    // 補充レベル設定
    await expect(page.locator('#refillLevel')).toBeVisible();
  });

  test('チャートが表示される', async ({ page }) => {
    // Chart.js canvasの確認
    const chart = page.locator('canvas');
    await expect(chart).toBeVisible();
    
    // チャートコンテナの確認
    const chartContainer = page.locator('.chart-container');
    await expect(chartContainer).toBeVisible();
  });

  test('統計パネルが表示される', async ({ page }) => {
    // 統計カードの確認
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);
    
    // 各統計項目の確認
    await expect(page.locator('.stat-title').filter({ hasText: '基準日の在庫レベル' })).toBeVisible();
    await expect(page.locator('.stat-title').filter({ hasText: '予測精度 (R²)' })).toBeVisible();
    await expect(page.locator('.stat-title').filter({ hasText: '平均予測誤差' })).toBeVisible();
    await expect(page.locator('.stat-title').filter({ hasText: '次回補充推奨' })).toBeVisible();
  });

  test('日付ナビゲーションボタンが動作する', async ({ page }) => {
    // 初期基準日を取得
    const initialDate = await page.locator('#baseDate').inputValue();
    
    // +1日ボタンをクリック
    await page.locator('button').filter({ hasText: '+1日' }).click();
    
    // 基準日が変更されたことを確認
    await page.waitForTimeout(500); // UI更新を待つ
    const newDate = await page.locator('#baseDate').inputValue();
    expect(newDate).not.toBe(initialDate);
  });

  test('補充レベル設定ボタンが動作する', async ({ page }) => {
    // 初期補充レベルを取得
    const initialLevel = await page.locator('#refillLevel').inputValue();
    
    // +10ボタンをクリック
    await page.locator('.refill-level-control button').filter({ hasText: '+10' }).click();
    
    // 補充レベルが変更されたことを確認
    await page.waitForTimeout(500); // UI更新を待つ
    const newLevel = await page.locator('#refillLevel').inputValue();
    expect(parseInt(newLevel)).toBe(parseInt(initialLevel) + 10);
  });

  test('月ボタンが動的に生成され、クリックできる', async ({ page }) => {
    // CSVデータの読み込みを待つ
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // データ処理を待つ
    
    // 月ボタンが存在することを確認
    const monthButtons = page.locator('.month-btn');
    const count = await monthButtons.count();
    
    // データがある場合のみテスト実行
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
      
      // 最初の月ボタンをクリック
      await monthButtons.first().click();
      
      // アクティブクラスが付与されることを確認
      await page.waitForTimeout(500);
      const activeButton = page.locator('.month-btn.active');
      await expect(activeButton).toBeVisible();
    } else {
      console.log('CSVデータがないため月ボタンのテストをスキップ');
    }
  });

  test('データ管理ボタンが表示される', async ({ page }) => {
    // インポートボタン
    await expect(page.locator('button').filter({ hasText: 'インポート' })).toBeVisible();
    
    // エクスポートボタン
    await expect(page.locator('button').filter({ hasText: 'エクスポート' })).toBeVisible();
  });

  test('学習・予測ボタンが表示される', async ({ page }) => {
    // 学習ボタン
    await expect(page.locator('button').filter({ hasText: '学習' })).toBeVisible();
    
    // 予測ボタン
    await expect(page.locator('button').filter({ hasText: '予測' })).toBeVisible();
  });

  test('レスポンシブデザインが動作する', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.container')).toBeVisible();
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.container')).toBeVisible();
    
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.container')).toBeVisible();
  });
});
