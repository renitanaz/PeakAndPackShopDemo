import { test, expect } from '../../fixtures';

test.describe('browsing the catalogue', { tag: '@regression' }, () => {
  test('search finds one product', async ({ pm }) => {
    await pm.onProductList().search('tent');
    expect(await pm.onProductList().getProductNames()).toEqual(['4-Season Tent']);
  });

  test('a search with no matches shows an empty list', async ({ page, pm }) => {
    await pm.onProductList().search('zzzz');
    await expect(page.getByText('No products match your filters.')).toBeVisible();
    expect(await pm.onProductList().getResultCount()).toBe('Showing 0 of 0 products');
  });

  test('the in-stock filter hides sold-out products', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('result-count')).toHaveText('Showing 10 of 10 products');
    await page.getByRole('checkbox', { name: 'In stock only' }).check({ force: true });
    await expect(page.getByTestId('result-count')).toHaveText('Showing 9 of 10 products');
  });

  test('a category filter narrows the list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Camping' }).check({ force: true });
    await expect(page.getByTestId('result-count')).toHaveText('Showing 2 of 10 products');
  });

  test('sorting by price puts the cheapest first', async ({ page }) => {
    await page.goto('/');
    const cards = page.getByTestId('product-card');
    await expect(cards.first()).toBeVisible();
    await page.getByLabel('Sort by').selectOption('price-asc');
    await expect(cards.first()).toBeVisible();

    const texts = await cards.getByText(/^\$/).allTextContents();
    const prices = texts.map((t) => Number(t.replace('$', '')));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
