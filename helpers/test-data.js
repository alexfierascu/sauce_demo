const CHECKOUT_INFO = {
  valid: {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '12345',
  },
  specialCharacters: {
    firstName: "O'Brien-Smith",
    lastName: 'Müller & Co.',
    postalCode: 'AB1 2CD',
  },
};

const PRODUCTS = {
  backpack: { id: 4, name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { id: 0, name: 'Sauce Labs Bike Light', price: 9.99 },
  boltTShirt: { id: 1, name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  onesie: { id: 2, name: 'Sauce Labs Onesie', price: 7.99 },
  allTheThingsTShirt: { id: 3, name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
  fleeceJacket: { id: 5, name: 'Sauce Labs Fleece Jacket', price: 49.99 },
};

const ALL_PRODUCT_NAMES_AZ = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
];

const ALL_PRICES_SORTED = [7.99, 9.99, 15.99, 15.99, 29.99, 49.99];

const SORT_OPTIONS = {
  nameAZ: 'az',
  nameZA: 'za',
  priceLowHigh: 'lohi',
  priceHighLow: 'hilo',
};

module.exports = {
  CHECKOUT_INFO,
  PRODUCTS,
  ALL_PRODUCT_NAMES_AZ,
  ALL_PRICES_SORTED,
  SORT_OPTIONS,
};
