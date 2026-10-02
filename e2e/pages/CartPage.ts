import { BasePage } from './BasePage';
import { CheckoutPage } from './CheckoutPage';

export class CartPage extends BasePage {
  async goto() {
    await this.navigate('/cart');
  }

  /** The number of items in the cart (one Remove button per row). */
  async getItemCount(): Promise<number> {
    // count() doesn't wait, so wait for the loaded cart first
    await this.page.getByRole('heading', { name: 'Your Cart' }).waitFor();
    return await this.page.getByRole('button', { name: 'Remove' }).count();
  }

  async removeFirstItem() {
    await this.page.getByRole('button', { name: 'Remove' }).first().click();
  }

  async proceedToCheckout(): Promise<CheckoutPage> {
    await this.page.getByRole('button', { name: /proceed to checkout/i }).click();
    return new CheckoutPage(this.page);
  }
}
