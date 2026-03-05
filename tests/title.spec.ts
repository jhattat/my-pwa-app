import { test, expect } from '@playwright/test';

test('homepage displays the title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My PWA App/);
});

test('homepage has the app heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /My PWA App/ })).toBeVisible();
});
