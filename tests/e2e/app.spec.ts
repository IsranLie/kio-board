import { expect, test } from '@playwright/test';

test('visits the app root url', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('ion-content')).toContainText('Adhivasindo');
  await expect(page.locator('ion-content')).toContainText('To do');
});
