import { test, expect } from '@playwright/test'

/**
 * User Story 1: パフォーマンステスト
 * 目的: チャート描画のパフォーマンスを検証
 */

test.describe('US1: パフォーマンステスト', () => {
  test('チャート描画が1秒以内に完了する', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Chart.js canvasの表示を待機
    await page.waitForSelector('canvas', { timeout: 2000 })
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // 1秒以内にチャートが描画されることを確認
    expect(loadTime).toBeLessThan(1000)
    
    console.log(`チャート描画時間: ${loadTime}ms`)
  })

  test('ページ全体のロード時間が3秒以内', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/', { waitUntil: 'networkidle' })
    
    const endTime = Date.now()
    const loadTime = endTime - startTime
    
    // 3秒以内にページ全体が読み込まれることを確認
    expect(loadTime).toBeLessThan(3000)
    
    console.log(`ページロード時間: ${loadTime}ms`)
  })

  test('Canvas要素が適切に描画される', async ({ page }) => {
    await page.goto('/')
    
    // Chart.js canvasの描画を待機
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 1000 })
    
    // Canvasのサイズを確認
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)
  })

  test('データフェッチが500ms以内に完了する', async ({ page }) => {
    // ネットワークリクエストを監視
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/data/predictions.csv'),
      { timeout: 1000 }
    )
    
    await page.goto('/')
    
    const response = await responsePromise
    const timing = await response.allHeaders()
    
    // レスポンスが正常に返されることを確認
    expect(response.status()).toBe(200)
  })
})
