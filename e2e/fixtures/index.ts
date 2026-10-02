import { test as base, expect, Page } from '@playwright/test';
import { API } from '../helpers/env';
import { authHeader, Customer, registerCustomer, signBrowserIn } from '../helpers/session';
import { CartPage } from '../pages/CartPage';
import { PageManager } from '../pages/PageManager';

type Fixtures = {
  customer: Customer;
  loggedInPage: Page;
  seededCart: CartPage;
  pm: PageManager;
};

export const test = base.extend<Fixtures>({
  // A brand-new customer, so every test owns its data and tests can run in parallel
  customer: async ({ request }, use) => {
    await use(await registerCustomer(request));
  },

  // The browser, signed in as that customer
  loggedInPage: async ({ page, customer }, use) => {
    await signBrowserIn(page, customer.token, customer.user);
    await page.goto('/');
    await use(page);
  },

  // A cart holding one item (Trekking Poles), with cleanup afterwards
  seededCart: async ({ request, customer, loggedInPage }, use) => {
    const added = await request.post(`${API}/api/cart`, {
      headers: authHeader(customer.token),
      data: { product_id: 1, quantity: 1 },
    });
    expect(added.status()).toBe(200);

    await use(new CartPage(loggedInPage));

    await request.delete(`${API}/api/cart/1`, { headers: authHeader(customer.token) });
  },

  // The page manager, already on the home page
  pm: async ({ page }, use) => {
    await page.goto('/');
    await use(new PageManager(page));
  },
});

export { expect };
