const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { USERS } = require('../../helpers/users');

test.describe('Login Page', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form elements', async ({ page }) => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(page).toHaveURL(/saucedemo\.com/);
  });

  test('should login successfully with standard_user', async ({ page }) => {
    await loginPage.login(USERS.standard.username, USERS.standard.password);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('should show error for locked_out_user', async () => {
    await loginPage.login(USERS.lockedOut.username, USERS.lockedOut.password);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Sorry, this user has been locked out');
  });

  test('should login successfully with problem_user', async ({ page }) => {
    await loginPage.login(USERS.problem.username, USERS.problem.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should login successfully with performance_glitch_user', async ({ page }) => {
    await loginPage.login(USERS.performanceGlitch.username, USERS.performanceGlitch.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should login successfully with error_user', async ({ page }) => {
    await loginPage.login(USERS.error.username, USERS.error.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should login successfully with visual_user', async ({ page }) => {
    await loginPage.login(USERS.visual.username, USERS.visual.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('should show error with invalid credentials', async () => {
    await loginPage.login('invalid_user', 'invalid_password');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Username and password do not match');
  });

  test('should show error when username is empty', async () => {
    await loginPage.login('', USERS.standard.password);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Username is required');
  });

  test('should show error when password is empty', async () => {
    await loginPage.login(USERS.standard.username, '');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Password is required');
  });

  test('should show error when both fields are empty', async () => {
    await loginPage.loginButton.click();
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Username is required');
  });
});
