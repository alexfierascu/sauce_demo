class CheckoutStepTwoPage {
  constructor(page) {
    this.page = page;
    this.cartItems = page.locator('[data-test="inventory-item"]');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.paymentInfo = page.locator('[data-test="payment-info-value"]');
    this.shippingInfo = page.locator('[data-test="shipping-info-value"]');
  }

  async finish() {
    await this.finishButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async getSubtotal() {
    const text = await this.subtotalLabel.textContent();
    return Number.parseFloat(text.replace('Item total: $', ''));
  }

  async getTax() {
    const text = await this.taxLabel.textContent();
    return Number.parseFloat(text.replace('Tax: $', ''));
  }

  async getTotal() {
    const text = await this.totalLabel.textContent();
    return Number.parseFloat(text.replace('Total: $', ''));
  }

  async getItemNames() {
    return this.page.locator('[data-test="inventory-item-name"]').allTextContents();
  }

  async getItemPrices() {
    const priceTexts = await this.page.locator('[data-test="inventory-item-price"]').allTextContents();
    return priceTexts.map((p) => Number.parseFloat(p.replace('$', '')));
  }

  async getPaymentInfo() {
    return this.paymentInfo.textContent();
  }

  async getShippingInfo() {
    return this.shippingInfo.textContent();
  }

  async getItemCount() {
    return this.cartItems.count();
  }
}

module.exports = { CheckoutStepTwoPage };
