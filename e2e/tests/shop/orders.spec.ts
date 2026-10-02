import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { API } from '../../helpers/env';
import { authHeader, registerCustomer } from '../../helpers/session';
import { OrdersPage } from '../../pages/OrdersPage';

// Puts one item in the customer's cart, checks out through the API, and returns the order id.
async function placeOrder(request: APIRequestContext, token: string): Promise<number> {
  await request.post(`${API}/api/cart`, { headers: authHeader(token), data: { product_id: 1, quantity: 1 } });
  const checkout = await request.post(`${API}/api/orders/checkout`, { headers: authHeader(token), data: {} });
  expect(checkout.status()).toBe(201);   // created
  return (await checkout.json()).order_id;
}

test('an order appears in the customer\'s order history', { tag: '@regression' }, async ({ request, customer, loggedInPage }) => {
  const orderId = await placeOrder(request, customer.token);

  const orders = new OrdersPage(loggedInPage);
  await orders.goto();
  await orders.waitForOrders();
  expect(await orders.countOrder(orderId)).toBe(1);
});

test('a visitor is asked to log in to see order history', { tag: '@regression' }, async ({ page }) => {
  const orders = new OrdersPage(page);
  await orders.goto();
  expect(await orders.getLoginPrompt()).toBe('You need to log in to view order history.');
});

test("BUG-010 in the browser: order history lists no one else's orders", { tag: ['@regression', '@known-bug'] }, async ({ request, loggedInPage }) => {
  test.fail();   // /api/orders returns every customer's orders, so the page shows them to this customer
  const someoneElse = await registerCustomer(request, 'Alice');
  const theirOrderId = await placeOrder(request, someoneElse.token);

  const orders = new OrdersPage(loggedInPage);
  await orders.goto();
  await orders.waitForOrders();   // the list loads together with the heading
  expect(await orders.countOrder(theirOrderId)).toBe(0);
});
