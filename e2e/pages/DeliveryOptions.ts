import { Locator, Page } from '@playwright/test';

export type DeliveryMethod = 'standard' | 'express';

// The visible text next to each option
const LABELS: Record<DeliveryMethod, string> = {
  standard: 'Standard (5 days)',
  express: 'Express (2 days)',
};

/** The delivery section of the checkout page. */
export class DeliveryOptions {
  private readonly timeButton: Locator;

  constructor(private readonly page: Page) {
    this.timeButton = page.getByRole('button', { name: /delivery time/i });
  }

  /** Choose how the order is delivered. */
  async chooseMethod(method: DeliveryMethod) {
    // The real radio button is hidden under a styled circle, so click the visible text
    await this.page.getByText(LABELS[method]).click();
  }

  /** True if this delivery method is the selected one. */
  async isMethodChosen(method: DeliveryMethod): Promise<boolean> {
    return this.page.getByRole('radio', { name: LABELS[method] }).isChecked();
  }

  /** Choose a delivery time, such as 'Evening (17-21)'. Works whether the list is open or closed. */
  async chooseTime(slot: string) {
    if (!(await this.isTimeListOpen())) {
      await this.timeButton.click();
    }
    await this.page.getByRole('option', { name: slot }).click();
  }

  /** The text of the time button, such as "Delivery time: Evening (17-21)". */
  async getTimeText(): Promise<string> {
    return (await this.timeButton.textContent()) ?? '';
  }

  private async isTimeListOpen(): Promise<boolean> {
    return (await this.timeButton.getAttribute('aria-expanded')) === 'true';
  }
}
