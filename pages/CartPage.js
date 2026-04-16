class CartPage {
  constructor(page) {
    this.page = page;
    this.cartItems = page.locator('[data-test="inventory-item"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  toKebabCase(itemName) {
    return itemName.toLowerCase().replaceAll(/\s+/g, '-');
  }

  async checkout() {
    await this.checkoutButton.click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async removeItem(itemName) {
    await this.page.locator(`[data-test="remove-${this.toKebabCase(itemName)}"]`).click();
  }

  async getCartItemNames() {
    return this.page.locator('[data-test="inventory-item-name"]').allTextContents();
  }

  async getCartItemPrices() {
    const priceTexts = await this.page.locator('[data-test="inventory-item-price"]').allTextContents();
    return priceTexts.map((p) => Number.parseFloat(p.replace('$', '')));
  }

  async getCartItemCount() {
    return this.cartItems.count();
  }

  async getItemQuantity(index = 0) {
    return this.page.locator('[data-test="item-quantity"]').nth(index).textContent();
  }
}

module.exports = { CartPage };
