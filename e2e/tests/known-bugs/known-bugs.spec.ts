import { test, expect } from '../../fixtures';
import { API } from '../../helpers/env';
import { authHeader, registerCustomer } from '../../helpers/session';

// Each test here states what the app SHOULD do, and is marked test.fail() because it doesn't yet.
// The run stays green while a bug exists. The day someone fixes it, the test turns red:
// remove its test.fail() line and it becomes a normal regression test.

test.describe('known bugs', { tag: '@known-bug' }, () => {
  test('BUG-008: an out-of-stock product cannot be ordered', async ({ request, customer }) => {
    test.fail();   // checkout never checks stock
    const auth = authHeader(customer.token);
    await request.post(`${API}/api/cart`, { headers: auth, data: { product_id: 10, quantity: 1 } });   // Climbing Harness: stock 0
    const res = await request.post(`${API}/api/orders/checkout`, { headers: auth, data: {} });
    expect(res.status()).toBe(400);
  });

  test('BUG-009: a 10% discount code takes 10% off', async ({ request, customer }) => {
    test.fail();   // SAVE10 takes 100% off
    const auth = authHeader(customer.token);
    await request.post(`${API}/api/cart`, { headers: auth, data: { product_id: 1, quantity: 1 } });   // Trekking Poles, $34.99
    const res = await request.post(`${API}/api/orders/checkout`, { headers: auth, data: { discount_code: 'SAVE10' } });
    expect((await res.json()).total).toBeCloseTo(34.99 * 0.9, 2);
  });

  test("BUG-010: a customer's order list shows only their own orders", async ({ request }) => {
    test.fail();   // /api/orders returns every customer's orders
    const alice = await registerCustomer(request, 'Alice');
    const bob = await registerCustomer(request, 'Bob');
    await request.post(`${API}/api/cart`, { headers: authHeader(alice.token), data: { product_id: 1, quantity: 1 } });
    const checkout = await request.post(`${API}/api/orders/checkout`, { headers: authHeader(alice.token), data: {} });
    const { order_id } = await checkout.json();

    const { orders } = await (await request.get(`${API}/api/orders`, { headers: authHeader(bob.token) })).json();
    expect(orders.map((o: { id: number }) => o.id)).not.toContain(order_id);
  });

  test('every product has a price above zero', async ({ request }) => {
    test.fail();   // the Sleeping Bag is priced at -89
    const { products } = await (await request.get(`${API}/api/products`)).json();
    expect(products.filter((p: { price: number }) => p.price <= 0).map((p: { name: string }) => p.name)).toEqual([]);
  });

  test('every product has a name', async ({ request }) => {
    test.fail();   // one product has an empty name
    const { products } = await (await request.get(`${API}/api/products`)).json();
    expect(products.filter((p: { name: string }) => !p.name).length).toBe(0);
  });

  test('the browser tab is branded, not "React App"', async ({ page }) => {
    test.fail();   // the title is still the starter template's default
    await page.goto('/');
    expect(await page.title()).not.toBe('React App');
  });
});
