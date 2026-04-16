const { LoginPage } = require('../pages/LoginPage');

async function loginAs(page, user) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.username, user.password);
}

async function measurePageLoad(page, action) {
  const start = Date.now();
  await action();
  const duration = Date.now() - start;
  return duration;
}

function calculateTax(subtotal) {
  return Math.round(subtotal * 0.08 * 100) / 100;
}

function calculateTotal(subtotal) {
  const tax = calculateTax(subtotal);
  return Math.round((subtotal + tax) * 100) / 100;
}

module.exports = {
  loginAs,
  measurePageLoad,
  calculateTax,
  calculateTotal,
};
