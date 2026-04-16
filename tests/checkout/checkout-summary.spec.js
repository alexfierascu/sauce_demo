const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../../pages/InventoryPage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutStepOnePage } = require('../../pages/CheckoutStepOnePage');
const { CheckoutStepTwoPage } = require('../../pages/CheckoutStepTwoPage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS, CHECKOUT_INFO } = require('../../helpers/test-data');
const { loginAs, calculateTax, calculateTotal } = require('../../helpers/utils');

test.describe('Checkout Step Two - Summary', () => {
  let summaryPage;

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
    summaryPage = new CheckoutStepTwoPage(page);
  });

  test('should display order summary', async ({ page }) => {
    await expect(page).toHaveURL(/checkout-step-two\.html/);
    const count = await summaryPage.getItemCount();
    expect(count).toBe(1);
  });

  test('should display correct item name', async () => {
    const names = await summaryPage.getItemNames();
    expect(names).toContain(PRODUCTS.backpack.name);
  });

  test('should display correct item price', async () => {
    const prices = await summaryPage.getItemPrices();
    expect(prices[0]).toBe(PRODUCTS.backpack.price);
  });

  test('should display correct subtotal', async () => {
    const subtotal = await summaryPage.getSubtotal();
    expect(subtotal).toBe(PRODUCTS.backpack.price);
  });

  test('should display correct tax calculation', async () => {
    const subtotal = await summaryPage.getSubtotal();
    const tax = await summaryPage.getTax();
    const expectedTax = calculateTax(subtotal);
    expect(tax).toBe(expectedTax);
  });

  test('should display correct total', async () => {
    const subtotal = await summaryPage.getSubtotal();
    const total = await summaryPage.getTotal();
    const expectedTotal = calculateTotal(subtotal);
    expect(total).toBe(expectedTotal);
  });

  test('should display payment information', async () => {
    const paymentInfo = await summaryPage.getPaymentInfo();
    expect(paymentInfo).toContain('SauceCard #31337');
  });

  test('should display shipping information', async () => {
    const shippingInfo = await summaryPage.getShippingInfo();
    expect(shippingInfo).toContain('Free Pony Express Delivery!');
  });

  test('should cancel and return to inventory', async ({ page }) => {
    await summaryPage.cancel();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should complete order with finish button', async ({ page }) => {
    await summaryPage.finish();
    await expect(page).toHaveURL(/checkout-complete\.html/);
  });
});

test.describe('Checkout Summary - Multiple Items', () => {
  test('should display correct totals for multiple items', async ({ page }) => {
    await loginAs(page, USERS.standard);
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
    await inventoryPage.addToCart(PRODUCTS.onesie.name);
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
    const expectedSubtotal = PRODUCTS.backpack.price + PRODUCTS.bikeLight.price + PRODUCTS.onesie.price;

    const subtotal = await summaryPage.getSubtotal();
    expect(subtotal).toBeCloseTo(expectedSubtotal, 2);

    const tax = await summaryPage.getTax();
    expect(tax).toBe(calculateTax(expectedSubtotal));

    const total = await summaryPage.getTotal();
    expect(total).toBe(calculateTotal(expectedSubtotal));

    expect(await summaryPage.getItemCount()).toBe(3);
  });
});
