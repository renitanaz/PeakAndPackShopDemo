import { test, expect } from '../../fixtures';

test('product cards stack in one column on a phone', { tag: '@regression' }, async ({ page }) => {
  await page.goto('/');
  const cards = page.getByTestId('product-card');
  await expect(cards.first()).toBeVisible();

  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(second!.y).toBeGreaterThan(first!.y);     // stacked: the second card is lower down
});
