import { test, expect } from '../../fixtures';
import { API } from '../../helpers/env';
import { authHeader, loginThroughApi } from '../../helpers/session';

test.describe('the API', { tag: ['@api', '@regression'] }, () => {
  test('the product list has the expected shape', async ({ request }) => {
    const res = await request.get(`${API}/api/products`);
    expect(res.status()).toBe(200);
    const { products } = await res.json();
    expect(products.length).toBeGreaterThan(0);
    expect(typeof products[0].id).toBe('number');
    expect(typeof products[0].price).toBe('number');
  });

  test('search takes the word as a query parameter', async ({ request }) => {
    const res = await request.get(`${API}/api/search`, { params: { q: 'tent' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.query).toBe('tent');
    expect(body.results.map((p: { name: string }) => p.name)).toContain('4-Season Tent');
  });

  test('an unknown product is a 404', async ({ request }) => {
    expect((await request.get(`${API}/api/products/999999`)).status()).toBe(404);
  });

  test('the cart needs a token', async ({ request }) => {
    const res = await request.post(`${API}/api/cart`, { data: { product_id: 1, quantity: 1 } });
    expect(res.status()).toBe(401);
  });

  test('an email can be registered only once', async ({ request }) => {
    const account = { name: 'QA Tester', email: `dup-${Date.now()}@peakandpack.test`, password: 'password123' };
    expect((await request.post(`${API}/api/auth/register`, { data: account })).status()).toBe(201);
    const again = await request.post(`${API}/api/auth/register`, { data: account });
    expect(again.status()).toBe(409);
    expect((await again.json()).error).toBe('Email already registered');
  });

  test('the admin API refuses a request with no token (401)', async ({ request }) => {
    expect((await request.get(`${API}/api/admin/products`)).status()).toBe(401);
  });

  test('the admin API refuses a customer token (403)', async ({ request, customer }) => {
    const res = await request.get(`${API}/api/admin/products`, { headers: authHeader(customer.token) });
    expect(res.status()).toBe(403);
  });

  test('the admin API accepts an admin token', async ({ request }) => {
    const admin = await loginThroughApi(request, 'admin@peakandpack.com', 'adminpass123');
    const res = await request.get(`${API}/api/admin/products`, { headers: authHeader(admin.token) });
    expect(res.status()).toBe(200);
  });
});
