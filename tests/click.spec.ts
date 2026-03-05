import { test, expect } from '@playwright/test';

test('click on count button increments the count', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: /Incrémente compteur/ });
  await button.click();
  await expect(button).toHaveText('Incrémente compteur 1');
});
