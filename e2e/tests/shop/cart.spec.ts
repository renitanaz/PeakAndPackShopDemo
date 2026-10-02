import { test, expect } from '../../fixtures';
import { PageManager } from '../../pages/PageManager';

test('the cart asks a visitor to log in', { tag: '@critical' }, async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByText('You need to log in to view your cart.')).toBeVisible();
});

test('a seeded cart shows its item', { tag: '@critical' }, async ({ seededCart, loggedInPage }) => {
  await seededCart.goto();
  expect(await seededCart.getItemCount()).toBe(1);
  await expect(loggedInPage.getByText('Trekking Poles (Pair)')).toBeVisible();
});

test('removing the last item empties the cart', { tag: '@regression' }, async ({ seededCart, loggedInPage }) => {
  await seededCart.goto();
  await seededCart.removeFirstItem();
  await expect(loggedInPage.getByText('Your cart is empty.')).toBeVisible();
});

test('adding a product from the list puts it in the cart', { tag: '@critical' }, async ({ loggedInPage }) => {
  const pm = new PageManager(loggedInPage);
  await pm.onProductList().addToCart('Headlamp');
  await pm.onProductList().openCart();
  expect(await pm.onCartPage().getItemCount()).toBe(1);
  await expect(loggedInPage.getByText('Headlamp')).toBeVisible();
});
