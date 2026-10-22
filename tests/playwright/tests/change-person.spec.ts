import { test, expect } from '../fixtures/index.js';

test('change person page should be accessible', { tag: '@accessibility' }, async ({ page, checkAccessibility }) => {
  const response = await page.goto('/change/person');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Change person', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save and continue' })).toBeVisible();

  await checkAccessibility();
});
