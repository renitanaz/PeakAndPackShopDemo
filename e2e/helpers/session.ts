import { expect, APIRequestContext, Page } from '@playwright/test';
import { API } from './env';

export type Customer = { email: string; token: string; user: object };

/** Registers a brand-new customer through the API. */
export async function registerCustomer(request: APIRequestContext, name = 'QA Tester'): Promise<Customer> {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 100000)}@peakandpack.test`;
  const res = await request.post(`${API}/api/auth/register`, {
    data: { name, email, password: 'password123' },
  });
  expect(res.status()).toBe(201);
  const { token, user } = await res.json();
  return { email, token, user };
}

/** Logs in through the API and returns the token and user. */
export async function loginThroughApi(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API}/api/auth/login`, { data: { email, password } });
  expect(res.status()).toBe(200);
  return (await res.json()) as { token: string; user: object };
}

/** Makes the browser believe it is logged in. PeakAndPack keeps its login in localStorage. */
export async function signBrowserIn(page: Page, token: string, user: object) {
  await page.addInitScript(([t, u]) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', u);
  }, [token, JSON.stringify(user)]);
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
