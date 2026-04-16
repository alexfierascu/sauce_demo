const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../../pages/InventoryPage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutStepOnePage } = require('../../pages/CheckoutStepOnePage');
const { CheckoutStepTwoPage } = require('../../pages/CheckoutStepTwoPage');
const { CheckoutCompletePage } = require('../../pages/CheckoutCompletePage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS, CHECKOUT_INFO } = require('../../helpers/test-data');
const { loginAs } = require('../../helpers/utils');

test.describe('Checkout Complete', () => {
  let completePage;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.standard);
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.goToCart();
    const cartPage = new CartPage(page);
    await cartPage.checkout();
    const checkoutPage = new CheckoutStepOnePage(page);
    await checkoutPage.fillInfo(
      CHECKOUT_INFO.valid.firstName,
      CHECKOUT_INFO.valid.lastName,
      CHECKOUT_INFO.valid.postalCode
    );
    await checkoutPage.proceed();
    const summaryPage = new CheckoutStepTwoPage(page);
    await summaryPage.finish();
    completePage = new CheckoutCompletePage(page);
  });

  test('should display confirmation page', async ({ page }) => {
    await expect(page).toHaveURL(/checkout-complete\.html/);
  });

  test('should display thank you header', async () => {
    const header = await completePage.getCompleteHeader();
    expect(header).toBe('Thank you for your order!');
  });

  test('should display order dispatch text', async () => {
    const text = await completePage.getCompleteText();
    expect(text).toContain('Your order has been dispatched');
  });

  test('should display pony express image', async () => {
    await expect(completePage.ponyExpressImage).toBeVisible();
  });

  test('should navigate back to products', async ({ page }) => {
    await completePage.backHome();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should have empty cart after order completion', async ({ page }) => {
    await completePage.backHome();
    const inventoryPage = new InventoryPage(page);
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
  });
});
