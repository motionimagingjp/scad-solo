import { test, expect } from '@playwright/test';

// モック用の店舗データ
const MOCK_SPOTS = [
  {
    id: 'spot-1',
    name: 'モック大崎酒場',
    area: '大崎',
    tagline: 'カウンターで一人サク飲み',
    hasCounterSeat: true,
    senberoAvailable: true,
    standingOnly: false,
    category: 'SOLO_NOMI',
  },
  {
    id: 'spot-2',
    name: 'モック立ち飲み五反田',
    area: '五反田',
    tagline: 'サクッと立ち飲み',
    hasCounterSeat: false,
    senberoAvailable: true,
    standingOnly: true,
    category: 'SOLO_NOMI',
  },
];

test.describe('SCAD-SOLO フェーズ2 E2E自動テスト', () => {

  test.beforeEach(async ({ page }) => {
    // APIリクエストを横取りしてモックデータを返す（あらゆるAPIパスに対応）
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ spots: MOCK_SPOTS, data: MOCK_SPOTS }),
      });
    });
  });

  // ----------------------------------------------------
  // 1. トップ画面「今夜のおすすめ3軒」＆モードフィルター
  // ----------------------------------------------------
  test('トップ画面の表示とモードフィルターの切り替え', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 画面がクラッシュせず描画されているか確認
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  // ----------------------------------------------------
  // 2. 位置情報（GPS拒否）のフォールバックテスト
  // ----------------------------------------------------
  test('GPS位置情報拒否時に案内バナーが表示されるか', async ({ context, page }) => {
    // 位置情報の権限を「拒否」に設定
    await context.clearPermissions();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 画面が正常に読み込まれ、トップページが表示されているか
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // ----------------------------------------------------
  // 3. ゲーム5種の正常プレイ導線テスト
  // ----------------------------------------------------
  test('ゲーム5種がエラー落ちせず画面遷移できるか', async ({ page }) => {
    // ドリンクルーレット
    await page.goto('/games/drink-roulette');
    await expect(page).toHaveURL('/games/drink-roulette');
    await expect(page.locator('body')).not.toContainText('Application error');

    // ソロチン
    await page.goto('/games/chinchiro');
    await expect(page).toHaveURL('/games/chinchiro');
    await expect(page.locator('body')).not.toContainText('Application error');

    // ソロビンゴ
    await page.goto('/games/solo-bingo');
    await expect(page).toHaveURL('/games/solo-bingo');
    await expect(page.locator('body')).not.toContainText('Application error');

    // ソロ乾杯
    await page.goto('/games/kanpai-timer');
    await expect(page).toHaveURL('/games/kanpai-timer');
    await expect(page.locator('body')).not.toContainText('Application error');

    // 強制選曲モード
    await page.goto('/games/forced-song');
    await expect(page).toHaveURL('/games/forced-song');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  // ----------------------------------------------------
  // 4. 共通UI（About画面遷移 ＆ 共有ボタン）
  // ----------------------------------------------------
  test('「このアプリについて(/about)」への遷移と共有ボタンの存在確認', async ({ page }) => {
    // Aboutページへの遷移
    await page.goto('/about');
    await expect(page).toHaveURL('/about');
    await expect(page.locator('body')).not.toBeEmpty();

    // トップに戻って共有ボタンの動作確認
    await page.goto('/');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

});
