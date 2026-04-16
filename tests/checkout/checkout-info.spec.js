const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../../pages/InventoryPage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutStepOnePage } = require('../../pages/CheckoutStepOnePage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS, CHECKOUT_INFO } = require('../../helpers/test-data');
const { loginAs } = require('../../helpers/utils');

test.describe('Checkout Step One - Information', () => {
  let checkoutPage;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.standard);
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.goToCart();
    const cartPage = new CartPage(page);
    await cartPage.checkout();
    checkoutPage = new CheckoutStepOnePage(page);
  });

  test('should display checkout form', async ({ page }) => {
    await expect(checkoutPage.firstNameInput).toBeVisible();
    await expect(checkoutPage.lastNameInput).toBeVisible();
    await expect(checkoutPage.postalCodeInput).toBeVisible();
    await expect(page).toHaveURL(/checkout-step-one\.html/);
  });

  test('should proceed with valid info', async ({ page }) => {
    await checkoutPage.fillInfo(
      CHECKOUT_INFO.valid.firstName,
      CHECKOUT_INFO.valid.lastName,
      CHECKOUT_INFO.valid.postalCode
    );
    await checkoutPage.proceed();
    await expect(page).toHaveURL(/checkout-step-two\.html/);
  });

  test('should show error when first name is missing', async () => {
    await checkoutPage.fillInfo('', CHECKOUT_INFO.valid.lastName, CHECKOUT_INFO.valid.postalCode);
    await checkoutPage.proceed();
    const error = await checkoutPage.getErrorMessage();
    expect(error).toContain('First Name is required');
  });

  test('should show error when last name is missing', async () => {
    await checkoutPage.fillInfo(CHECKOUT_INFO.valid.firstName, '', CHECKOUT_INFO.valid.postalCode);
    await checkoutPage.proceed();
    const error = await checkoutPage.getErrorMessage();
    expect(error).toContain('Last Name is required');
  });

  test('should show error when postal code is missing', async () => {
    await checkoutPage.fillInfo(CHECKOUT_INFO.valid.firstName, CHECKOUT_INFO.valid.lastName, '');
    await checkoutPage.proceed();
    const error = await checkoutPage.getErrorMessage();
    expect(error).toContain('Postal Code is required');
  });

  test('should show error when all fields are empty', async () => {
    await checkoutPage.proceed();
    const error = await checkoutPage.getErrorMessage();
    expect(error).toContain('First Name is required');
  });

  test('should accept special characters in fields', async ({ page }) => {
    await checkoutPage.fillInfo(
      CHECKOUT_INFO.specialCharacters.firstName,
      CHECKOUT_INFO.specialCharacters.lastName,
      CHECKOUT_INFO.specialCharacters.postalCode
    );
    await checkoutPage.proceed();
    await expect(page).toHaveURL(/checkout-step-two\.html/);
  });

  test('should cancel and return to cart', async ({ page }) => {
    await checkoutPage.cancel();
    await expect(page).toHaveURL(/cart\.html/);
  });
});
