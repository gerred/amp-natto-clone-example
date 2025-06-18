import { test, expect } from '@playwright/test';

test('demo app loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Live Widgets')).toBeVisible();
  await expect(page.locator('.react-flow__viewport')).toBeVisible();
});

test('canvas displays initial nodes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-id="1"]')).toBeVisible();
  await expect(page.locator('[data-id="2"]')).toBeVisible();
});
