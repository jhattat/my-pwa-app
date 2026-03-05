import { test, expect } from '@playwright/test';

test('counter increments on click', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: /count is/ });
  await expect(button).toHaveText('count is 0');
  await button.click();
  await expect(button).toHaveText('count is 1');
});
