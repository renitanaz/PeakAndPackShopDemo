import { test, expect, Page } from '@playwright/test';
import { API } from '../../helpers/env';

// The admin panel is served by the API server, and keeps its login in memory,
// so each test signs in through the panel's own form.
async function signInAsAdmin(page: Page) {
  await page.goto(`${API}/admin/`);
  await page.getByPlaceholder('admin@peakandpack.com').fill('admin@peakandpack.com');
  await page.getByPlaceholder('Password').fill('adminpass123');
  await page.getByRole('button', { name: 'Sign in as admin' }).click();
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
}

test.describe('the admin panel', { tag: '@regression' }, () => {
  test('the products table shows a product row', async ({ page }) => {
    await signInAsAdmin(page);
    const row = page.getByRole('row', { name: /Headlamp/ });
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell').nth(2)).toHaveText('$24.99');
    await expect(row.getByRole('cell').nth(3)).toHaveText('60');
  });

  test('exactly one product is out of stock', async ({ page }) => {
    await signInAsAdmin(page);
    await expect(page.getByRole('row', { name: /Headlamp/ })).toBeVisible();
    const outOfStock = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '0', exact: true }) });
    await expect(outOfStock).toHaveCount(1);
    await expect(outOfStock).toContainText('Climbing Harness');
  });
});
