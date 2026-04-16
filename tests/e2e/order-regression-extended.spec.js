const { test, expect } = require('@playwright/test');
const { InventoryPage } = require('../../pages/InventoryPage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutStepOnePage } = require('../../pages/CheckoutStepOnePage');
const { CheckoutStepTwoPage } = require('../../pages/CheckoutStepTwoPage');
const { CheckoutCompletePage } = require('../../pages/CheckoutCompletePage');
const { USERS } = require('../../helpers/users');
const { PRODUCTS, CHECKOUT_INFO } = require('../../helpers/test-data');
const { loginAs, calculateTax, calculateTotal } = require('../../helpers/utils');

test.describe('Cart Badge Accuracy Throughout Flow', () => {
  test('should maintain correct badge count across all checkout pages', async ({ page }) => {
    const cartBadge = page.locator('[data-test="shopping-cart-badge"]');

    await test.step('Login and add 2 items', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
      await expect(cartBadge).toHaveText('2');
    });

    await test.step('Verify badge persists on cart page', async () => {
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.goToCart();
      await expect(cartBadge).toHaveText('2');
    });

    await test.step('Verify badge persists on checkout info page', async () => {
      const cartPage = new CartPage(page);
      await cartPage.checkout();
      await expect(cartBadge).toHaveText('2');
    });

    await test.step('Verify badge persists on checkout summary page', async () => {
      const checkoutPage = new CheckoutStepOnePage(page);
      await checkoutPage.fillInfo(
        CHECKOUT_INFO.valid.firstName,
        CHECKOUT_INFO.valid.lastName,
        CHECKOUT_INFO.valid.postalCode
      );
      await checkoutPage.proceed();
      await expect(cartBadge).toHaveText('2');
    });

    await test.step('Verify badge disappears after order completion', async () => {
      const summaryPage = new CheckoutStepTwoPage(page);
      await summaryPage.finish();
      await expect(cartBadge).not.toBeVisible();
    });
  });

  test('should update badge incrementally when adding and removing items', async ({ page }) => {
    const cartBadge = page.locator('[data-test="shopping-cart-badge"]');

    await test.step('Login and verify no badge initially', async () => {
      await loginAs(page, USERS.standard);
      await expect(cartBadge).not.toBeVisible();
    });

    const inventoryPage = new InventoryPage(page);

    await test.step('Add items one by one and verify badge increments', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await expect(cartBadge).toHaveText('1');

      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      await expect(cartBadge).toHaveText('2');

      await inventoryPage.addToCart(PRODUCTS.fleeceJacket.name);
      await expect(cartBadge).toHaveText('3');
    });

    await test.step('Remove items one by one and verify badge decrements', async () => {
      await inventoryPage.removeFromCart(PRODUCTS.onesie.name);
      await expect(cartBadge).toHaveText('2');

      await inventoryPage.removeFromCart(PRODUCTS.backpack.name);
      await expect(cartBadge).toHaveText('1');

      await inventoryPage.removeFromCart(PRODUCTS.fleeceJacket.name);
      await expect(cartBadge).not.toBeVisible();
    });
  });
});

test.describe('Consecutive Orders', () => {
  test('should complete two orders back-to-back successfully', async ({ page }) => {
    await test.step('Login as standard user', async () => {
      await loginAs(page, USERS.standard);
    });

    const inventoryPage = new InventoryPage(page);

    await test.step('First order: add Backpack and complete checkout', async () => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.goToCart();
      let cartPage = new CartPage(page);
      await cartPage.checkout();

      let checkoutPage = new CheckoutStepOnePage(page);
      await checkoutPage.fillInfo(
        CHECKOUT_INFO.valid.firstName,
        CHECKOUT_INFO.valid.lastName,
        CHECKOUT_INFO.valid.postalCode
      );
      await checkoutPage.proceed();

      let summaryPage = new CheckoutStepTwoPage(page);
      expect(await summaryPage.getSubtotal()).toBe(PRODUCTS.backpack.price);
      await summaryPage.finish();

      let completePage = new CheckoutCompletePage(page);
      expect(await completePage.getCompleteHeader()).toBe('Thank you for your order!');
    });

    await test.step('Return home and verify cart is empty', async () => {
      const completePage = new CheckoutCompletePage(page);
      await completePage.backHome();
      await expect(page).toHaveURL(/inventory\.html/);
      expect(await inventoryPage.getCartBadgeCount()).toBe(0);
    });

    await test.step('Second order: add Bike Light + Onesie and complete checkout', async () => {
      await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(2);

      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      expect(await cartPage.getCartItemCount()).toBe(2);
      await cartPage.checkout();

      const checkoutPage = new CheckoutStepOnePage(page);
      await checkoutPage.fillInfo(
        CHECKOUT_INFO.valid.firstName,
        CHECKOUT_INFO.valid.lastName,
        CHECKOUT_INFO.valid.postalCode
      );
      await checkoutPage.proceed();

      const summaryPage = new CheckoutStepTwoPage(page);
      const expectedSubtotal = PRODUCTS.bikeLight.price + PRODUCTS.onesie.price;
      expect(await summaryPage.getSubtotal()).toBeCloseTo(expectedSubtotal, 2);
      expect(await summaryPage.getTax()).toBe(calculateTax(expectedSubtotal));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(expectedSubtotal));
      await summaryPage.finish();

      const completePage = new CheckoutCompletePage(page);
      expect(await completePage.getCompleteHeader()).toBe('Thank you for your order!');
    });
  });

  test('should not carry over items from first order into second', async ({ page }) => {
    await test.step('Login and complete first order with Backpack', async () => {
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
      const completePage = new CheckoutCompletePage(page);
      await completePage.backHome();
    });

    await test.step('Add only Onesie and verify cart has no leftover items', async () => {
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      const names = await cartPage.getCartItemNames();
      expect(names).toEqual([PRODUCTS.onesie.name]);
      expect(names).not.toContain(PRODUCTS.backpack.name);
    });
  });
});

test.describe('Sidebar Menu During Checkout', () => {
  async function openSidebar(page) {
    await page.locator('#react-burger-menu-btn').click();
    await page.locator('.bm-menu').waitFor({ state: 'visible' });
  }

  test('should clear cart when using Reset App State from inventory', async ({ page }) => {
    await test.step('Login and add 2 items to cart', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
      expect(await inventoryPage.getCartBadgeCount()).toBe(2);
    });

    await test.step('Open sidebar and click Reset App State', async () => {
      await openSidebar(page);
      await page.locator('[data-test="reset-sidebar-link"]').click();
      await page.locator('#react-burger-cross-btn').click();
    });

    await test.step('Navigate to cart and verify it is empty', async () => {
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      expect(await cartPage.getCartItemCount()).toBe(0);
    });
  });

  test('should preserve cart when using All Items from checkout info', async ({ page }) => {
    await test.step('Login, add item, and navigate to checkout info', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      await cartPage.checkout();
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });

    await test.step('Open sidebar and navigate to All Items', async () => {
      await openSidebar(page);
      await page.locator('[data-test="inventory-sidebar-link"]').click();
      await expect(page).toHaveURL(/inventory\.html/);
    });

    await test.step('Verify cart still has the item', async () => {
      const inventoryPage = new InventoryPage(page);
      expect(await inventoryPage.getCartBadgeCount()).toBe(1);
    });
  });

  test('should preserve cart when using All Items from checkout summary', async ({ page }) => {
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

    await test.step('Open sidebar and navigate to All Items', async () => {
      await openSidebar(page);
      await page.locator('[data-test="inventory-sidebar-link"]').click();
      await expect(page).toHaveURL(/inventory\.html/);
    });

    await test.step('Verify cart still has the item', async () => {
      const inventoryPage = new InventoryPage(page);
      expect(await inventoryPage.getCartBadgeCount()).toBe(1);
    });
  });

  test('should abort checkout flow when resetting app state mid-checkout', async ({ page }) => {
    await test.step('Login, add items, and navigate to checkout info', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      await cartPage.checkout();
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });

    await test.step('Open sidebar, reset app state, and go to All Items', async () => {
      await openSidebar(page);
      await page.locator('[data-test="reset-sidebar-link"]').click();
      await page.locator('[data-test="inventory-sidebar-link"]').click();
      await expect(page).toHaveURL(/inventory\.html/);
    });

    await test.step('Verify cart is empty on inventory and cart pages', async () => {
      const inventoryPage = new InventoryPage(page);
      expect(await inventoryPage.getCartBadgeCount()).toBe(0);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      expect(await cartPage.getCartItemCount()).toBe(0);
    });
  });
});

test.describe('Tax Calculation — Various Combinations', () => {
  async function getToSummary(page, products) {
    await loginAs(page, USERS.standard);
    const inventoryPage = new InventoryPage(page);
    for (const product of products) {
      await inventoryPage.addToCart(product.name);
    }
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
    return new CheckoutStepTwoPage(page);
  }

  test('cheapest item alone — Onesie $7.99', async ({ page }) => {
    const summaryPage = await getToSummary(page, [PRODUCTS.onesie]);

    await test.step('Verify subtotal, tax, and total', async () => {
      const subtotal = await summaryPage.getSubtotal();
      expect(subtotal).toBe(PRODUCTS.onesie.price);
      expect(await summaryPage.getTax()).toBe(calculateTax(subtotal));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(subtotal));
    });
  });

  test('most expensive item alone — Fleece Jacket $49.99', async ({ page }) => {
    const summaryPage = await getToSummary(page, [PRODUCTS.fleeceJacket]);

    await test.step('Verify subtotal, tax, and total', async () => {
      const subtotal = await summaryPage.getSubtotal();
      expect(subtotal).toBe(PRODUCTS.fleeceJacket.price);
      expect(await summaryPage.getTax()).toBe(calculateTax(subtotal));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(subtotal));
    });
  });

  test('two items with identical price — $15.99 + $15.99', async ({ page }) => {
    const summaryPage = await getToSummary(page, [PRODUCTS.boltTShirt, PRODUCTS.allTheThingsTShirt]);

    await test.step('Verify subtotal, tax, and total', async () => {
      const expectedSubtotal = PRODUCTS.boltTShirt.price + PRODUCTS.allTheThingsTShirt.price;
      const subtotal = await summaryPage.getSubtotal();
      expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(await summaryPage.getTax()).toBe(calculateTax(expectedSubtotal));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(expectedSubtotal));
    });
  });

  test('two cheapest items — Onesie $7.99 + Bike Light $9.99', async ({ page }) => {
    const summaryPage = await getToSummary(page, [PRODUCTS.onesie, PRODUCTS.bikeLight]);

    await test.step('Verify subtotal, tax, and total', async () => {
      const expectedSubtotal = PRODUCTS.onesie.price + PRODUCTS.bikeLight.price;
      const subtotal = await summaryPage.getSubtotal();
      expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(await summaryPage.getTax()).toBe(calculateTax(expectedSubtotal));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(expectedSubtotal));
    });
  });

  test('two most expensive items — Backpack $29.99 + Fleece Jacket $49.99', async ({ page }) => {
    const summaryPage = await getToSummary(page, [PRODUCTS.backpack, PRODUCTS.fleeceJacket]);

    await test.step('Verify subtotal, tax, and total', async () => {
      const expectedSubtotal = PRODUCTS.backpack.price + PRODUCTS.fleeceJacket.price;
      const subtotal = await summaryPage.getSubtotal();
      expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(await summaryPage.getTax()).toBe(calculateTax(expectedSubtotal));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(expectedSubtotal));
    });
  });

  test('all 6 items combined', async ({ page }) => {
    const allProducts = Object.values(PRODUCTS);
    const summaryPage = await getToSummary(page, allProducts);

    await test.step('Verify subtotal, tax, and total', async () => {
      const expectedSubtotal = allProducts.reduce((sum, p) => sum + p.price, 0);
      const subtotal = await summaryPage.getSubtotal();
      expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(await summaryPage.getTax()).toBe(calculateTax(expectedSubtotal));
      expect(await summaryPage.getTotal()).toBe(calculateTotal(expectedSubtotal));
    });
  });
});

test.describe('Item Detail Links from Cart', () => {
  test('should navigate to product detail when clicking item name in cart', async ({ page }) => {
    await test.step('Login and add Backpack to cart', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.goToCart();
    });

    await test.step('Click item title link in cart', async () => {
      await page.locator(`[data-test="item-${PRODUCTS.backpack.id}-title-link"]`).click();
      await expect(page).toHaveURL(/inventory-item\.html\?id=4/);
    });

    await test.step('Verify product detail page shows correct info', async () => {
      await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(PRODUCTS.backpack.name);
      await expect(page.locator('[data-test="inventory-item-price"]')).toContainText('$29.99');
      await expect(page.locator('[data-test="inventory-item-desc"]')).toBeVisible();
    });
  });

  test('should preserve cart after visiting product detail and returning', async ({ page }) => {
    await test.step('Login and add 2 items to cart', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
      await inventoryPage.goToCart();
    });

    await test.step('Visit product detail page from cart', async () => {
      await page.locator(`[data-test="item-${PRODUCTS.backpack.id}-title-link"]`).click();
      await expect(page).toHaveURL(/inventory-item\.html/);
    });

    await test.step('Return to products and verify cart still has both items', async () => {
      await page.locator('[data-test="back-to-products"]').click();
      await expect(page).toHaveURL(/inventory\.html/);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.goToCart();
      const cartPage = new CartPage(page);
      expect(await cartPage.getCartItemCount()).toBe(2);
      const names = await cartPage.getCartItemNames();
      expect(names).toContain(PRODUCTS.backpack.name);
      expect(names).toContain(PRODUCTS.bikeLight.name);
    });
  });

  test('should show correct details for different products from cart', async ({ page }) => {
    await test.step('Login and add Onesie + Fleece Jacket to cart', async () => {
      await loginAs(page, USERS.standard);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      await inventoryPage.addToCart(PRODUCTS.fleeceJacket.name);
      await inventoryPage.goToCart();
    });

    await test.step('Click Onesie and verify detail page', async () => {
      await page.locator(`[data-test="item-${PRODUCTS.onesie.id}-title-link"]`).click();
      await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(PRODUCTS.onesie.name);
      await expect(page.locator('[data-test="inventory-item-price"]')).toContainText('$7.99');
    });

    await test.step('Go back and click Fleece Jacket and verify detail page', async () => {
      await page.goBack();
      await expect(page).toHaveURL(/cart\.html/);
      await page.locator(`[data-test="item-${PRODUCTS.fleeceJacket.id}-title-link"]`).click();
      await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(PRODUCTS.fleeceJacket.name);
      await expect(page.locator('[data-test="inventory-item-price"]')).toContainText('$49.99');
    });
  });
});
