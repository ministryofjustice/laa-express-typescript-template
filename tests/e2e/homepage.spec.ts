import { test, expect } from '@playwright/test';

test('homepage should have the correct title & warning text', async ({ page }) => {
	// Navigate to the homepage
	await page.goto('/');

	// Check for the title of the application
	await expect(page).toHaveTitle(/Manage your civil cases/);

	// Check for the warning text is visible
	await expect(page.getByText('MCC is under construction. Please stay tuned.')).toBeVisible();
});

test('homepage should display LAA header', async ({ page }) => {
	// Navigate to the homepage
	await page.goto('/');

	const header = page.getByRole('banner');
	const signOutLink = header.getByRole('link', { name: 'Sign out' });

	// Check for the header with LAA branding
	await expect(header).toBeVisible();
	// Check sign out link in header
  await expect(signOutLink).toBeVisible();
});
