import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async loginAs(email: string, password: string) {
    // The form's labels aren't linked to its fields, so the input type is the stable hook
    await this.page.locator('input[type="email"]').fill(email);
    await this.page.locator('input[type="password"]').fill(password);
    await this.page.getByRole('button', { name: /log in/i }).click();
  }

  async assertLoggedIn() {
    await expect(this.page).toHaveURL('/');
    await expect(this.page.getByRole('button', { name: /log out/i })).toBeVisible();
  }
}
