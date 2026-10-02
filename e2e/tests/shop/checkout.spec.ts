import { test, expect } from '../../fixtures';

test('a customer can check out', { tag: '@critical' }, async ({ seededCart }) => {
  await seededCart.goto();
  const checkout = await seededCart.proceedToCheckout();
  await checkout.payWithTestCard();
  await checkout.placeOrder();
  expect(await checkout.isOrderConfirmed()).toBe(true);
  expect(await checkout.getOrderId()).toMatch(/^\d+$/);
  expect(await checkout.getTotalCharged()).toBe(34.99);        // Trekking Poles
});

test('Confirm Order stays disabled until the payment is done', { tag: '@regression' }, async ({ seededCart, loggedInPage }) => {
  await seededCart.goto();
  const checkout = await seededCart.proceedToCheckout();
  const confirm = loggedInPage.getByRole('button', { name: /complete payment|confirm order/i });
  await expect(confirm).toBeDisabled();
  await checkout.payWithTestCard();
  await expect(confirm).toBeEnabled();
});

test('delivery choices appear in the confirmation', { tag: '@regression' }, async ({ seededCart, loggedInPage }) => {
  await seededCart.goto();
  const checkout = await seededCart.proceedToCheckout();

  await checkout.delivery.chooseMethod('express');
  expect(await checkout.delivery.isMethodChosen('express')).toBe(true);
  expect(await checkout.delivery.isMethodChosen('standard')).toBe(false);
  await checkout.delivery.chooseTime('Evening (17-21)');
  expect(await checkout.delivery.getTimeText()).toBe('Delivery time: Evening (17-21)');

  await checkout.payWithTestCard();
  await checkout.placeOrder();
  await expect(loggedInPage.getByText('Delivery: Express, Evening (17-21)')).toBeVisible();
});

test('store pickup is not available', { tag: '@regression' }, async ({ seededCart, loggedInPage }) => {
  await seededCart.goto();
  await seededCart.proceedToCheckout();
  await expect(loggedInPage.getByRole('radio', { name: /store pickup/i })).toBeDisabled();
});
