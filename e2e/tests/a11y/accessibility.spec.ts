import { test, expect } from '../../fixtures';
import AxeBuilder from '@axe-core/playwright';

test('the product list has no serious accessibility violations', { tag: ['@a11y', '@known-bug'] }, async ({ page }) => {
  // The grey "category / stock" line is #888 on white (3.54:1, 4.5:1 needed), so this fails today.
  test.fail();
  await page.goto('/');
  await expect(page.getByTestId('product-card').first()).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} element(s)`), 'serious accessibility violations').toEqual([]);
});
