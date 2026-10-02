import { BasePage } from './BasePage';

export class OrdersPage extends BasePage {
  async goto() {
    await this.navigate('/orders');
  }

  /** Waits until the order list has loaded. The heading appears together with the list. */
  async waitForOrders() {
    await this.page.getByRole('heading', { name: 'Order History' }).waitFor();
  }

  /** How many cards show this order number. count() doesn't wait, so call waitForOrders first. */
  async countOrder(orderId: number): Promise<number> {
    return await this.page.getByText(`Order #${orderId}`, { exact: true }).count();
  }

  /** What a visitor who is not logged in sees instead of the list. */
  async getLoginPrompt(): Promise<string> {
    return (await this.page.getByText('You need to log in to view order history.').textContent()) ?? '';
  }
}
