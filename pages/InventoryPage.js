class InventoryPage {
  constructor(page) {
    this.page = page;
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.title = page.locator('[data-test="title"]');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  toKebabCase(itemName) {
    return itemName.toLowerCase().replace(/\s+/g, '-');
  }

  async addToCart(itemName) {
    await this.page.locator(`[data-test="add-to-cart-${this.toKebabCase(itemName)}"]`).click();
  }

  async removeFromCart(itemName) {
    await this.page.locator(`[data-test="remove-${this.toKebabCase(itemName)}"]`).click();
  }

  async sortBy(option) {
    await this.sortDropdown.selectOption(option);
  }

  async getCartBadgeCount() {
    if (await this.cartBadge.isVisible()) {
      return Number.parseInt(await this.cartBadge.textContent());
    }
    return 0;
  }

  async goToCart() {
    await this.cartLink.click();
  }

  async getProductNames() {
    return this.page.locator('[data-test="inventory-item-name"]').allTextContents();
  }

  async getProductPrices() {
    const priceTexts = await this.page.locator('[data-test="inventory-item-price"]').allTextContents();
    return priceTexts.map((p) => Number.parseFloat(p.replace('$', '')));
  }

  async getItemCount() {
    return this.inventoryItems.count();
  }

  async logout() {
    await this.burgerMenuButton.click();
    await this.logoutLink.click();
  }
}

module.exports = { InventoryPage };
