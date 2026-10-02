import { Page } from '@playwright/test';

export class BasePage {
  // protected: this class and every class that extends it can use page; tests can't
  constructor(protected readonly page: Page) {}

  async navigate(path: string) {
    await this.page.goto(path);
  }

  /** The greeting in the header, such as "Hi, Test User". */
  async getGreeting(): Promise<string> {
    return (await this.page.getByText(/^Hi, /).textContent()) ?? '';
  }
}
