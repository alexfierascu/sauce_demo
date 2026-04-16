class CheckoutCompletePage {
  constructor(page) {
    this.page = page;
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.completeText = page.locator('[data-test="complete-text"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
    this.ponyExpressImage = page.locator('[data-test="pony-express"]');
  }

  async backHome() {
    await this.backHomeButton.click();
  }

  async getCompleteHeader() {
    return this.completeHeader.textContent();
  }

  async getCompleteText() {
    return this.completeText.textContent();
  }
}

module.exports = { CheckoutCompletePage };
