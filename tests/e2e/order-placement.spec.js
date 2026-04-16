const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { InventoryPage } = require('../../pages/InventoryPage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutStepOnePage } = require('../../pages/CheckoutStepOnePage');
const { CheckoutStepTwoPage } = require('../../pages/CheckoutStepTwoPage');
const { CheckoutCompletePage } = require('../../pages/CheckoutCompletePage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS, CHECKOUT_INFO } = require('../../helpers/test-data');
const { loginAs, calculateTax, calculateTotal, measurePageLoad } = require('../../helpers/utils');

test.describe('E2E Order Placement', () => {
  test('should complete full order with single item', async ({ page }) => {
    await test.step('Login as standard user', async () => {
      await loginAs(page, USERS.standard);
      await expect(page).toHaveURL(/inventory\.html/);
    });

    const inventoryPage = new InventoryPage(page);

    await test.step('Add Backpack to cart', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(1);
    });

    await test.step('Navigate to cart and verify item', async () => {
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      const cartNames = await cartPage.getCartItemNames();
      expect(cartNames).toContain(PRODUCTS.backpack.name);
      expect(await cartPage.getCartItemCount()).toBe(1);
    });

    await test.step('Proceed to checkout', async () => {
      const cartPage = new CartPage(page);
      await cartPage.checkout();
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });

    await test.step('Fill checkout information', async () => {
      const checkoutPage = new CheckoutStepOnePage(page);
      await checkoutPage.fillInfo(
        CHECKOUT_INFO.valid.firstName,
        CHECKOUT_INFO.valid.lastName,
        CHECKOUT_INFO.valid.postalCode
      );
      await checkoutPage.proceed();
      await expect(page).toHaveURL(/checkout-step-two\.html/);
    });

    await test.step('Verify order summary (price, tax, total)', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      const summaryNames = await summaryPage.getItemNames();
      expect(summaryNames).toContain(PRODUCTS.backpack.name);
      expect(await summaryPage.getSubtotal()).toBe(PRODUCTS.backpack.price);
      expect(await summaryPage.getTax()).toBe(calculateTax(PRODUCTS.backpack.price));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(PRODUCTS.backpack.price));
    });

    await test.step('Complete order and verify confirmation', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      await summaryPage.finish();
      await expect(page).toHaveURL(/checkout-complete\.html/);
      const completePage = new CheckoutCompletePage(page);
      expect(await completePage.getCompleteHeader()).toBe('Thank you for your order!');
    });
  });

  test('should complete full order with multiple items', async ({ page }) => {
    await test.step('Login as standard user', async () => {
      await loginAs(page, USERS.standard);
    });

    const inventoryPage = new InventoryPage(page);

    await test.step('Add 3 items to cart', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
      await inventoryPage.addToCart(PRODUCTS.fleeceJacket.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(3);
    });

    await test.step('Navigate to cart and verify all items present', async () => {
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      expect(await cartPage.getCartItemCount()).toBe(3);
      const cartNames = await cartPage.getCartItemNames();
      expect(cartNames).toContain(PRODUCTS.backpack.name);
      expect(cartNames).toContain(PRODUCTS.bikeLight.name);
      expect(cartNames).toContain(PRODUCTS.fleeceJacket.name);
    });

    await test.step('Fill checkout information', async () => {
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

    await test.step('Verify combined totals on summary', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      const expectedSubtotal = PRODUCTS.backpack.price + PRODUCTS.bikeLight.price + PRODUCTS.fleeceJacket.price;
      expect(await summaryPage.getSubtotal()).toBeCloseTo(expectedSubtotal, 2);
      expect(await summaryPage.getTotal()).toBe(calculateTotal(expectedSubtotal));
      expect(await summaryPage.getItemCount()).toBe(3);
    });

    await test.step('Complete order and verify confirmation', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      await summaryPage.finish();
      const completePage = new CheckoutCompletePage(page);
      expect(await completePage.getCompleteHeader()).toBe('Thank you for your order!');
    });
  });

  test('should complete full order with all 6 items', async ({ page }) => {
    await test.step('Login as standard user', async () => {
      await loginAs(page, USERS.standard);
    });

    const inventoryPage = new InventoryPage(page);

    await test.step('Add all 6 items to cart', async () => {
      for (const product of Object.values(PRODUCTS)) {
        await inventoryPage.addToCart(product.name);
      }
      expect(await inventoryPage.getCartBadgeCount()).toBe(6);
    });

    await test.step('Verify cart contains 6 items', async () => {
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      expect(await cartPage.getCartItemCount()).toBe(6);
    });

    await test.step('Fill checkout information', async () => {
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

    await test.step('Verify all items in summary with correct subtotal', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      const expectedSubtotal = Object.values(PRODUCTS).reduce((sum, p) => sum + p.price, 0);
      expect(await summaryPage.getSubtotal()).toBeCloseTo(expectedSubtotal, 2);
      expect(await summaryPage.getItemCount()).toBe(6);
    });

    await test.step('Complete order and verify confirmation', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      await summaryPage.finish();
      expect(await new CheckoutCompletePage(page).getCompleteHeader()).toBe('Thank you for your order!');
    });
  });

  for (const [userKey, user] of Object.entries(USERS)) {
    if (userKey === 'lockedOut' || userKey === 'problem') continue;

    test(`should attempt full order flow as ${user.username}`, async ({ page }) => {
      await test.step('Login', async () => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(user.username, user.password);
        await expect(page).toHaveURL(/inventory\.html/);
      });

      await test.step('Add item and go to cart', async () => {
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.addToCart(PRODUCTS.onesie.name);
        await inventoryPage.goToCart();
      });

      await test.step('Fill checkout information', async () => {
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

      await test.step('Finish order and verify result', async () => {
        const summaryPage = new CheckoutStepTwoPage(page);
        await summaryPage.finish();
        const url = page.url();
        if (url.includes('checkout-complete')) {
          const completePage = new CheckoutCompletePage(page);
          expect(await completePage.getCompleteHeader()).toBe('Thank you for your order!');
        }
      });
    });
  }

  test('should detect problem_user Last Name bug during checkout', async ({ page }) => {
    await test.step('Login as problem_user', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(USERS.problem.username, USERS.problem.password);
      await expect(page).toHaveURL(/inventory\.html/);
    });

    await test.step('Add item and navigate to checkout', async () => {
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      await cartPage.checkout();
    });

    await test.step('Fill checkout form and attempt to continue', async () => {
      const checkoutPage = new CheckoutStepOnePage(page);
      await checkoutPage.fillInfo(
        CHECKOUT_INFO.valid.firstName,
        CHECKOUT_INFO.valid.lastName,
        CHECKOUT_INFO.valid.postalCode
      );
      await checkoutPage.proceed();
    });

    await test.step('Verify Last Name bug — error shown despite filling the field', async () => {
      const checkoutPage = new CheckoutStepOnePage(page);
      const error = await checkoutPage.getErrorMessage();
      expect(error).toContain('Last Name is required');
    });
  });

  test('should measure login performance for performance_glitch_user', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    await test.step('Login and measure time to inventory page', async () => {
      const loginPage = new LoginPage(page);
      const duration = await measurePageLoad(page, async () => {
        await loginPage.login(USERS.performanceGlitch.username, USERS.performanceGlitch.password);
        await page.waitForURL(/inventory\.html/);
      });
      expect(duration).toBeLessThan(10000);
    });
  });

  test('should take visual snapshots at each checkout step', async ({ page }) => {
    await test.step('Login and add item to cart', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
    });

    await test.step('Snapshot: Inventory page with item in cart', async () => {
      await expect(page).toHaveScreenshot('inventory-with-item.png', { maxDiffPixels: 100 });
    });

    await test.step('Snapshot: Cart page with item', async () => {
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.goToCart();
      await expect(page).toHaveScreenshot('cart-with-item.png', { maxDiffPixels: 100 });
    });

    await test.step('Snapshot: Checkout info form', async () => {
      const cartPage = new CartPage(page);
      await cartPage.checkout();
      await expect(page).toHaveScreenshot('checkout-info.png', { maxDiffPixels: 100 });
    });

    await test.step('Snapshot: Checkout summary', async () => {
      const checkoutPage = new CheckoutStepOnePage(page);
      await checkoutPage.fillInfo(
        CHECKOUT_INFO.valid.firstName,
        CHECKOUT_INFO.valid.lastName,
        CHECKOUT_INFO.valid.postalCode
      );
      await checkoutPage.proceed();
      await expect(page).toHaveScreenshot('checkout-summary.png', { maxDiffPixels: 100 });
    });

    await test.step('Snapshot: Checkout complete', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      await summaryPage.finish();
      await expect(page).toHaveScreenshot('checkout-complete.png', { maxDiffPixels: 100 });
    });
  });
});
