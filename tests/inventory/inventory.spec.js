const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../../pages/InventoryPage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS, ALL_PRODUCT_NAMES_AZ, ALL_PRICES_SORTED, SORT_OPTIONS } = require('../../helpers/test-data');
const { loginAs } = require('../../helpers/utils');

test.describe('Inventory Page', () => {
  let inventoryPage;

  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.standard);
    inventoryPage = new InventoryPage(page);
  });

  test('should display 6 products', async () => {
    const count = await inventoryPage.getItemCount();
    expect(count).toBe(6);
  });

  test('should display correct product names', async () => {
    const names = await inventoryPage.getProductNames();
    expect(names.sort()).toEqual([...ALL_PRODUCT_NAMES_AZ].sort());
  });

  test('should display correct product prices', async () => {
    const prices = await inventoryPage.getProductPrices();
    expect(prices.sort((a, b) => a - b)).toEqual(ALL_PRICES_SORTED);
  });

  test('should have correct page URL', async ({ page }) => {
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should have correct page title', async () => {
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test.describe('Add to Cart', () => {
    test('should add single item to cart', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(1);
    });

    test('should add multiple items to cart', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(3);
    });

    test('should show remove button after adding item', async ({ page }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await expect(page.locator('[data-test="remove-sauce-labs-backpack"]')).toBeVisible();
    });

    test('should remove item from cart via inventory page', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(1);
      await inventoryPage.removeFromCart(PRODUCTS.backpack.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(0);
    });
  });

  test.describe('Sorting', () => {
    test('should sort by name A to Z', async () => {
      await inventoryPage.sortBy(SORT_OPTIONS.nameAZ);
      const names = await inventoryPage.getProductNames();
      expect(names).toEqual(ALL_PRODUCT_NAMES_AZ);
    });

    test('should sort by name Z to A', async () => {
      await inventoryPage.sortBy(SORT_OPTIONS.nameZA);
      const names = await inventoryPage.getProductNames();
      expect(names).toEqual([...ALL_PRODUCT_NAMES_AZ].reverse());
    });

    test('should sort by price low to high', async () => {
      await inventoryPage.sortBy(SORT_OPTIONS.priceLowHigh);
      const prices = await inventoryPage.getProductPrices();
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    test('should sort by price high to low', async () => {
      await inventoryPage.sortBy(SORT_OPTIONS.priceHighLow);
      const prices = await inventoryPage.getProductPrices();
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });
  });

  test('should navigate to cart', async ({ page }) => {
    await inventoryPage.goToCart();
    await expect(page).toHaveURL(/cart\.html/);
  });
});
