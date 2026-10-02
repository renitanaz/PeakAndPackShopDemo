import { BasePage } from './BasePage';
import { CartPage } from './CartPage';
import { step } from '../helpers/step';

export class ProductListPage extends BasePage {
  async goto() {
    await this.navigate('/');
  }

  /** Search for a word, and wait until the list has been updated. */
  @step('Search the product list')
  async search(word: string) {
    await this.page.getByPlaceholder('Search gear...').fill(word);
    const done = this.page.waitForResponse((r) => r.url().includes('/api/search'));
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
    await done;
  }

  /** The names of the products on screen. */
  async getProductNames(): Promise<string[]> {
    const titles = await this.page.getByTestId('product-card').getByRole('heading').allTextContents();
    return titles.map((t) => t.replace('\u2197', '').trim());   // drop the small arrow link
  }

  /** The "Showing 9 of 10 products" line. */
  async getResultCount(): Promise<string> {
    return (await this.page.getByTestId('result-count').textContent()) ?? '';
  }

  /** Add one product to the cart, and wait for the server to accept it. */
  @step('Add a product to the cart')
  async addToCart(productName: string) {
    const card = this.page.getByTestId('product-card')
      .filter({ has: this.page.getByRole('heading', { name: productName }) });
    const added = this.page.waitForResponse(
      (r) => r.url().includes('/api/cart') && r.request().method() === 'POST' && r.status() === 200
    );
    await card.getByRole('button', { name: /add to cart/i }).click();
    await added;
  }

  /** Go to the cart page through the header link. */
  async openCart(): Promise<CartPage> {
    await this.page.getByRole('link', { name: 'Cart' }).click();
    return new CartPage(this.page);
  }
}
