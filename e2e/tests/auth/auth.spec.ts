import { test, expect } from '../../fixtures';
import { loginThroughApi, signBrowserIn } from '../../helpers/session';
import { LoginPage } from '../../pages/LoginPage';

test('the demo customer can log in', { tag: '@critical' }, async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs('test@peakandpack.com', 'password123');
  await login.assertLoggedIn();
  await expect(page.getByText('Hi, Test User')).toBeVisible();
});

test('a wrong password is refused with a message', { tag: '@regression' }, async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs('test@peakandpack.com', 'not-the-password');
  await expect(page.getByText('Invalid credentials')).toBeVisible();
  await expect(page.getByRole('button', { name: /log out/i })).toHaveCount(0);
});

test('a new customer can register and is signed in', { tag: '@critical' }, async ({ page }) => {
  await page.goto('/register');
  // The form's labels aren't linked to its fields, so the input type is the stable hook
  await page.locator('input[type="text"]').fill('Casey Climber');
  await page.locator('input[type="email"]').fill(`casey-${Date.now()}@peakandpack.test`);
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByText('Hi, Casey Climber')).toBeVisible();
});

test('a customer does not see the Admin link', { tag: '@regression' }, async ({ loggedInPage }) => {
  await expect(loggedInPage.getByText(/^Hi, /)).toBeVisible();   // proves the session loaded
  await expect(loggedInPage.getByRole('link', { name: 'Admin' })).toHaveCount(0);
});

test('an admin sees the Admin link', { tag: '@regression' }, async ({ page, request }) => {
  const admin = await loginThroughApi(request, 'admin@peakandpack.com', 'adminpass123');
  await signBrowserIn(page, admin.token, admin.user);
  await page.goto('/');
  await expect(page.getByText('Hi, Admin')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
});
