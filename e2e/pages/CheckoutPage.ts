import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { DeliveryOptions } from './DeliveryOptions';
import { step } from '../helpers/step';

export class CheckoutPage extends BasePage {
  /** The delivery section: method and time. */
  readonly delivery: DeliveryOptions;

  constructor(page: Page) {
    super(page);
    this.delivery = new DeliveryOptions(page);
  }

  /** Enter a discount code (optional step). */
  @step('Apply discount code')
  async applyDiscount(code: string) {
    await this.page.getByPlaceholder('e.g. SAVE10').fill(code);
  }

  /** Fill the payment form, which lives inside an iframe, and press Pay now. */
  @step('Pay with the test card')
  async payWithTestCard() {
    const frame = this.page.frameLocator('iframe[title="Payment form"]');
    await frame.getByLabel(/card number/i).fill('4111111111111111');
    await frame.getByLabel(/expiry/i).fill('12/28');
    await frame.getByLabel(/cvv/i).fill('123');
    await frame.getByLabel(/cardholder name/i).fill('Test User');
    await frame.getByRole('button', { name: /pay now/i }).click();
  }

  /** Confirm the order and wait for the server to create it. */
  @step('Place the order')
  async placeOrder() {
    const done = this.page.waitForResponse(
      (r) => r.url().includes('/api/orders/checkout') && r.status() === 201
    );
    await this.page.getByRole('button', { name: /confirm order/i }).click();
    await done;
  }

  async isOrderConfirmed(): Promise<boolean> {
    return this.page.getByRole('heading', { name: /order placed/i })
      .waitFor({ timeout: 5000 })
      .then(() => true, () => false);
  }

  /** The number from "Order ID: 42", as text. */
  async getOrderId(): Promise<string> {
    return this.textAfter(/Order ID: \d+/, 'Order ID: ');
  }

  /** The amount from "Total charged: $54.99", as a number. */
  async getTotalCharged(): Promise<number> {
    return Number(await this.textAfter(/Total charged: \$[\d.]+/, 'Total charged: $'));
  }

  private async textAfter(pattern: RegExp, prefix: string): Promise<string> {
    const text = await this.page.getByText(pattern).textContent();
    return (text ?? '').replace(prefix, '');
  }
}
