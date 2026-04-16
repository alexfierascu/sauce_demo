const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../../pages/InventoryPage');
const { CartPage } = require('../../pages/CartPage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS } = require('../../helpers/test-data');
const { loginAs } = require('../../helpers/utils');

test.describe('Cart Page', () => {
  let inventoryPage;
  let cartPage;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.standard);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
  });

  test('should display empty cart', async ({ page }) => {
    await inventoryPage.goToCart();
    const count = await cartPage.getCartItemCount();
    expect(count).toBe(0);
    await expect(page).toHaveURL(/cart\.html/);
  });

  test('should display added item in cart', async () => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.goToCart();
    const names = await cartPage.getCartItemNames();
    expect(names).toContain(PRODUCTS.backpack.name);
  });

  test('should display correct item price in cart', async () => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.goToCart();
    const prices = await cartPage.getCartItemPrices();
    expect(prices[0]).toBe(PRODUCTS.backpack.price);
  });

  test('should display correct item quantity', async () => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.goToCart();
    const quantity = await cartPage.getItemQuantity();
    expect(quantity.trim()).toBe('1');
  });

  test('should display multiple items in cart', async () => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
    await inventoryPage.addToCart(PRODUCTS.onesie.name);
    await inventoryPage.goToCart();
    const count = await cartPage.getCartItemCount();
    expect(count).toBe(3);
  });

  test('should remove item from cart', async () => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
    await inventoryPage.goToCart();
    await cartPage.removeItem(PRODUCTS.backpack.name);
    const names = await cartPage.getCartItemNames();
    expect(names).not.toContain(PRODUCTS.backpack.name);
    expect(names).toContain(PRODUCTS.bikeLight.name);
  });

  test('should continue shopping from cart', async ({ page }) => {
    await inventoryPage.goToCart();
    await cartPage.continueShopping();
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should proceed to checkout', async ({ page }) => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.goToCart();
    await cartPage.checkout();
    await expect(page).toHaveURL(/checkout-step-one\.html/);
  });

  test('should preserve cart items after navigation', async () => {
    await inventoryPage.addToCart(PRODUCTS.backpack.name);
    await inventoryPage.goToCart();
    await cartPage.continueShopping();
    await inventoryPage.goToCart();
    const names = await cartPage.getCartItemNames();
    expect(names).toContain(PRODUCTS.backpack.name);
  });
});
