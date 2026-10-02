import { test, expect } from '../../fixtures';
import { API } from '../../helpers/env';

test('the store opens and lists products', { tag: '@critical' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /peakandpack gear/i })).toBeVisible();
  await expect(page.getByTestId('product-card').first()).toBeVisible();
});

test('the search box is available', { tag: '@critical' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Search gear...')).toBeVisible();
});

test('the API is healthy', { tag: '@critical' }, async ({ request }) => {
  const res = await request.get(`${API}/health`);
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe('ok');
});
