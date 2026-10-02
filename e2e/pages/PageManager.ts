import { Page } from '@playwright/test';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { LoginPage } from './LoginPage';
import { ProductListPage } from './ProductListPage';

export class PageManager {
  private readonly loginPage: LoginPage;
  private readonly productListPage: ProductListPage;
  private readonly cartPage: CartPage;
  private readonly checkoutPage: CheckoutPage;

  constructor(page: Page) {
    // Every page object shares the one browser tab
    this.loginPage = new LoginPage(page);
    this.productListPage = new ProductListPage(page);
    this.cartPage = new CartPage(page);
    this.checkoutPage = new CheckoutPage(page);
  }

  onLoginPage() { return this.loginPage; }
  onProductList() { return this.productListPage; }
  onCartPage() { return this.cartPage; }
  onCheckoutPage() { return this.checkoutPage; }
}
