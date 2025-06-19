import { test, expect } from '@playwright/test';

test('new cases page has correct H1 text', async ({ page }) => {
  // Navigate to the new cases page
  await page.goto('/cases/new');

  // Check that h1 text exists
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('New cases');
});
