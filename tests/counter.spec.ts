import { test, expect } from '@playwright/test';

test('counter increments on click', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: /Incrémente compteur/ });
  await expect(button).toHaveText('Incrémente compteur 0');
  await button.click();
  await expect(button).toHaveText('Incrémente compteur 1');
});
