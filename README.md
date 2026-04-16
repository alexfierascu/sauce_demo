# SauceDemo Automated Regression Tests

Automated test suite for the order placement process on [saucedemo.com](https://www.saucedemo.com/), built with **Playwright** and **JavaScript**.

## Tech Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev/) | Browser automation & test runner |
| JavaScript (Node.js) | Programming language |
| Chromium | Target browser |
| GitHub Actions | CI/CD pipeline |
| dotenv | Environment variable management |

## Project Structure

```
├── pages/                          # Page Object Models
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   ├── CheckoutStepOnePage.js
│   ├── CheckoutStepTwoPage.js
│   └── CheckoutCompletePage.js
├── helpers/                        # Utilities & test data
│   ├── users.js                    # User credentials (from .env)
│   ├── test-data.js                # Products, prices, checkout data
│   └── utils.js                    # Login helper, tax calc, perf measurement
├── tests/
│   ├── login/login.spec.js                 # Login page tests
│   ├── inventory/inventory.spec.js         # Product listing & sorting tests
│   ├── cart/cart.spec.js                   # Shopping cart tests
│   ├── checkout/
│   │   ├── checkout-info.spec.js           # Checkout form validation tests
│   │   ├── checkout-summary.spec.js        # Order summary & totals tests
│   │   └── checkout-complete.spec.js       # Order confirmation tests
│   ├── e2e/
│   │   ├── order-placement.spec.js         # Full E2E order flows
│   │   └── order-regression-extended.spec.js # Extended regression coverage
│   └── negative/edge-cases.spec.js         # Edge cases & negative scenarios
├── .env.example                    # Environment variable template
├── .github/workflows/tests.yml     # GitHub Actions CI pipeline
├── playwright.config.js            # Playwright configuration
└── package.json
```

## Architecture

The project uses a **Hybrid Page Object Model (POM)** pattern:

- **Page Objects** (`pages/`) — encapsulate page-specific selectors and actions
- **Helpers** (`helpers/`) — shared utilities like login, tax calculation, and test data
- **Tests** (`tests/`) — organized by feature area, with isolated stage tests and full E2E flows

All credentials are loaded from environment variables (`.env` file), keeping secrets out of the codebase.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Create your .env file from the template
cp .env.example .env
# Edit .env and fill in the actual credentials
```

## Running Tests

```bash
# Run all tests (headed mode by default)
npm test

# Run in headed mode (visible browser)
npm run test:headed

# Run with Playwright UI mode (interactive)
npm run test:ui

# Run a specific test file
npx playwright test tests/e2e/order-placement.spec.js

# Run tests matching a keyword
npx playwright test -g "checkout"

# View HTML report after a test run
npm run test:report
```

### Parallel Execution

Tests run in parallel by default. Configure the worker count via the `WORKERS` environment variable in `.env`:

```
WORKERS=4
```

Or override from the command line:

```bash
npx playwright test --workers=2
```

## Test Coverage

### Summary: 103 tests across 9 test files

| File | Tests | Coverage Area |
|---|---|---|
| `login.spec.js` | 11 | All 6 user types, invalid credentials, empty field validation |
| `inventory.spec.js` | 14 | Product listing, prices, add/remove cart, 4 sort modes |
| `cart.spec.js` | 9 | Item display, prices, quantity, remove, navigation, persistence |
| `checkout-info.spec.js` | 8 | Form validation, missing fields, special characters, cancel |
| `checkout-summary.spec.js` | 11 | Item details, subtotal, tax, total, payment/shipping info |
| `checkout-complete.spec.js` | 6 | Confirmation text, image, back navigation, cart reset |
| `order-placement.spec.js` | 10 | Full E2E flows (1/3/6 items), all user types, visual snapshots, performance |
| `order-regression-extended.spec.js` | 17 | Cart badge tracking, consecutive orders, sidebar menu, tax combos, product detail links |
| `edge-cases.spec.js` | 17 | Empty cart, mid-checkout removal, back/forward nav, special chars, auth guards, logout |

### Order Placement Regression Coverage

| Stage | What's Tested |
|---|---|
| **Login** | All 6 user types, invalid credentials, empty fields, locked-out user |
| **Product Selection** | Browsing, adding/removing from cart, sorting (name & price), correct prices |
| **Cart Review** | Item details, quantities, prices, remove items, navigation persistence |
| **Checkout Info** | Form validation (missing fields, special characters, unicode, long inputs) |
| **Order Summary** | Subtotal, 8% tax calculation, total, payment & shipping info, multiple item combos |
| **Order Confirmation** | Success message, pony express image, back navigation, cart state reset |
| **Cross-cutting** | Cart badge accuracy across all pages, consecutive orders, sidebar menu interactions, browser back/forward, session/auth guards, visual regression snapshots, performance thresholds |

### Known Bugs Detected

| User | Bug | Test |
|---|---|---|
| `problem_user` | Last Name field doesn't retain its value during checkout | `order-placement.spec.js` |

## CI/CD

Tests run automatically on GitHub Actions for every push and pull request to `main`/`master`.

The pipeline:
1. Checks out code
2. Installs Node.js 20 and dependencies
3. Installs Chromium browser
4. Runs all tests in headless mode with 4 workers
5. Uploads the HTML report as an artifact (retained 30 days)

## Configuration

| Setting | Default | CI |
|---|---|---|
| Browser | Chromium | Chromium |
| Headless | No (headed) | Yes |
| Parallel workers | Configurable (`WORKERS` env) | 4 |
| Retries | 0 | 2 |
| Screenshots | On failure only | On failure only |
| Video | Retain on failure | Retain on failure |
| Trace | On first retry | On first retry |
| Report | HTML + list | HTML + list |

## Author

Alex Fierascu (<ioan.fierascu@gmail.com>)
