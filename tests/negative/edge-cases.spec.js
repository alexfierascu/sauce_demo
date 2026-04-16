const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { InventoryPage } = require('../../pages/InventoryPage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutStepOnePage } = require('../../pages/CheckoutStepOnePage');
const { CheckoutStepTwoPage } = require('../../pages/CheckoutStepTwoPage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS, CHECKOUT_INFO } = require('../../helpers/test-data');
const { loginAs } = require('../../helpers/utils');

test.describe('Edge Cases & Negative Scenarios', () => {
  test.describe('Empty Cart Checkout', () => {
    test('should allow navigating to checkout with empty cart', async ({ page }) => {
      await test.step('Login and go directly to cart', async () => {
        await loginAs(page, USERS.standard);
        await page.goto('/cart.html');
      });

      await test.step('Verify cart is empty', async () => {
        const cartPage = new CartPage(page);
        expect(await cartPage.getCartItemCount()).toBe(0);
      });

      await test.step('Proceed to checkout and verify navigation', async () => {
        const cartPage = new CartPage(page);
        await cartPage.checkout();
        await expect(page).toHaveURL(/checkout-step-one\.html/);
      });
    });
  });

  test.describe('Remove Items Mid-Checkout', () => {
    test('should handle removing all items from cart', async ({ page }) => {
      await test.step('Login and add 2 items', async () => {
        await loginAs(page, USERS.standard);
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
        await inventoryPage.goToCart();
      });

      await test.step('Remove both items and verify cart is empty', async () => {
        const cartPage = new CartPage(page);
        await cartPage.removeItem(PRODUCTS.backpack.name);
        await cartPage.removeItem(PRODUCTS.bikeLight.name);
        expect(await cartPage.getCartItemCount()).toBe(0);
      });
    });

    test('should continue checkout after removing one item', async ({ page }) => {
      await test.step('Login and add 2 items', async () => {
        await loginAs(page, USERS.standard);
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
        await inventoryPage.goToCart();
      });

      await test.step('Remove Backpack and verify only Bike Light remains', async () => {
        const cartPage = new CartPage(page);
        await cartPage.removeItem(PRODUCTS.backpack.name);
        expect(await cartPage.getCartItemCount()).toBe(1);
      });

      await test.step('Complete checkout with remaining item', async () => {
        const cartPage = new CartPage(page);
        await cartPage.checkout();
        const checkoutPage = new CheckoutStepOnePage(page);
        await checkoutPage.fillInfo(
          CHECKOUT_INFO.valid.firstName,
          CHECKOUT_INFO.valid.lastName,
          CHECKOUT_INFO.valid.postalCode
        );
        await checkoutPage.proceed();
      });

      await test.step('Verify summary shows only Bike Light with correct subtotal', async () => {
        const summaryPage = new CheckoutStepTwoPage(page);
        expect(await summaryPage.getItemCount()).toBe(1);
        expect(await summaryPage.getSubtotal()).toBe(PRODUCTS.bikeLight.price);
      });
    });
  });

  test.describe('Navigation Back/Forward', () => {
    test('should handle browser back from checkout info to cart', async ({ page }) => {
      await test.step('Login, add item, and navigate to checkout info', async () => {
        await loginAs(page, USERS.standard);
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.goToCart();
        const cartPage = new CartPage(page);
        await cartPage.checkout();
        await expect(page).toHaveURL(/checkout-step-one\.html/);
      });

      await test.step('Press browser back and verify cart page with item preserved', async () => {
        await page.goBack();
        await expect(page).toHaveURL(/cart\.html/);
        const names = await new CartPage(page).getCartItemNames();
        expect(names).toContain(PRODUCTS.backpack.name);
      });
    });

    test('should handle browser back from checkout summary', async ({ page }) => {
      await test.step('Login, add item, and navigate to checkout summary', async () => {
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
        await expect(page).toHaveURL(/checkout-step-two\.html/);
      });

      await test.step('Press browser back and verify checkout info page', async () => {
        await page.goBack();
        await expect(page).toHaveURL(/checkout-step-one\.html/);
      });
    });

    test('should handle forward navigation after back', async ({ page }) => {
      await test.step('Login, add item, and navigate to checkout info', async () => {
        await loginAs(page, USERS.standard);
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.goToCart();
        const cartPage = new CartPage(page);
        await cartPage.checkout();
        await expect(page).toHaveURL(/checkout-step-one\.html/);
      });

      await test.step('Press back to cart, then forward to checkout info', async () => {
        await page.goBack();
        await expect(page).toHaveURL(/cart\.html/);
        await page.goForward();
        await expect(page).toHaveURL(/checkout-step-one\.html/);
      });
    });
  });

  test.describe('Special Characters in Checkout Fields', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      await cartPage.checkout();
    });

    test('should accept names with apostrophes and hyphens', async ({ page }) => {
      await test.step('Fill form with apostrophes and hyphens and submit', async () => {
        const checkoutPage = new CheckoutStepOnePage(page);
        await checkoutPage.fillInfo("O'Brien-Smith", "McDonald's", 'AB1-2CD');
        await checkoutPage.proceed();
        await expect(page).toHaveURL(/checkout-step-two\.html/);
      });
    });

    test('should accept unicode characters', async ({ page }) => {
      await test.step('Fill form with unicode characters and submit', async () => {
        const checkoutPage = new CheckoutStepOnePage(page);
        await checkoutPage.fillInfo('Müller', 'Günther', '12345');
        await checkoutPage.proceed();
        await expect(page).toHaveURL(/checkout-step-two\.html/);
      });
    });

    test('should accept numeric-only postal codes', async ({ page }) => {
      await test.step('Fill form with all-zero postal code and submit', async () => {
        const checkoutPage = new CheckoutStepOnePage(page);
        await checkoutPage.fillInfo('John', 'Doe', '00000');
        await checkoutPage.proceed();
        await expect(page).toHaveURL(/checkout-step-two\.html/);
      });
    });

    test('should accept long input values', async ({ page }) => {
      await test.step('Fill form with 100-character strings and submit', async () => {
        const checkoutPage = new CheckoutStepOnePage(page);
        await checkoutPage.fillInfo('A'.repeat(100), 'B'.repeat(100), '12345-6789');
        await checkoutPage.proceed();
        await expect(page).toHaveURL(/checkout-step-two\.html/);
      });
    });
  });

  test.describe('Locked Out User', () => {
    test('should not be able to login', async ({ page }) => {
      await test.step('Attempt login with locked out credentials', async () => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(USERS.lockedOut.username, USERS.lockedOut.password);
      });

      await test.step('Verify error message and URL stays on login page', async () => {
        const loginPage = new LoginPage(page);
        const error = await loginPage.getErrorMessage();
        expect(error).toContain('Sorry, this user has been locked out');
        await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/?$/);
      });
    });
  });

  test.describe('Session & Authorization', () => {
    test('should redirect to login when accessing inventory without auth', async ({ page }) => {
      await test.step('Navigate directly to inventory URL without logging in', async () => {
        await page.goto('https://www.saucedemo.com/inventory.html');
        await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/?$/);
      });
    });

    test('should redirect to login when accessing cart without auth', async ({ page }) => {
      await test.step('Navigate directly to cart URL without logging in', async () => {
        await page.goto('https://www.saucedemo.com/cart.html');
        await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/?$/);
      });
    });

    test('should redirect to login when accessing checkout without auth', async ({ page }) => {
      await test.step('Navigate directly to checkout URL without logging in', async () => {
        await page.goto('https://www.saucedemo.com/checkout-step-one.html');
        await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/?$/);
      });
    });

    test('should logout successfully', async ({ page }) => {
      await test.step('Login and then logout via sidebar', async () => {
        await loginAs(page, USERS.standard);
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.logout();
        await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/?$/);
      });
    });

    test('should not access inventory after logout', async ({ page }) => {
      await test.step('Login and logout', async () => {
        await loginAs(page, USERS.standard);
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.logout();
      });

      await test.step('Attempt to access inventory and verify redirect to login', async () => {
        await page.goto('https://www.saucedemo.com/inventory.html');
        await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/?$/);
      });
    });
  });

  test.describe('URL Validation', () => {
    test('should have correct URLs throughout entire checkout flow', async ({ page }) => {
      await test.step('Login and verify inventory URL', async () => {
        await loginAs(page, USERS.standard);
        await expect(page).toHaveURL(/inventory\.html/);
      });

      await test.step('Add item, go to cart, and verify cart URL', async () => {
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.goToCart();
        await expect(page).toHaveURL(/cart\.html/);
      });

      await test.step('Proceed to checkout and verify checkout-step-one URL', async () => {
        const cartPage = new CartPage(page);
        await cartPage.checkout();
        await expect(page).toHaveURL(/checkout-step-one\.html/);
      });

      await test.step('Fill info, continue, and verify checkout-step-two URL', async () => {
        const checkoutPage = new CheckoutStepOnePage(page);
        await checkoutPage.fillInfo(
          CHECKOUT_INFO.valid.firstName,
          CHECKOUT_INFO.valid.lastName,
          CHECKOUT_INFO.valid.postalCode
        );
        await checkoutPage.proceed();
        await expect(page).toHaveURL(/checkout-step-two\.html/);
      });

      await test.step('Finish and verify checkout-complete URL', async () => {
        const summaryPage = new CheckoutStepTwoPage(page);
        await summaryPage.finish();
        await expect(page).toHaveURL(/checkout-complete\.html/);
      });
    });
  });
});
