# Wearables Atelier

A standalone Vite, React and TypeScript frontend. The existing customer and admin interfaces run entirely on dummy data and browser storage. No backend, database, environment file, service account or external credentials are required.

## Development

Use Node.js 24 (the version used in CI and the cloud environment).

```sh
npm ci
npm run dev
```

Each cloud task already has an isolated checkout. Use that checkout; do not create a Git worktree unless explicitly requested.

## Demo accounts and data

Sign in through the existing account page with a sample password of at least six characters:

| Interface | Demo email |
| --- | --- |
| Admin owner | `owner@demo.example` |
| Admin manager | `manager@demo.example` |
| Admin editor | `editor@demo.example` |
| Customer | `customer@demo.example` |

Passwords are never stored, verified against a real identity, or sent anywhere. Use fictional input only. New accounts and admin membership changes are local simulations, not access controls suitable for a deployed service.

The demo includes the existing ten-product catalog and collections, 24 sample orders, six customers, custom orders, enquiries, wholesale leads, subscribers, coupons, reviews, a draft flyer and an audit entry. The existing advertised `IDANGANGAN` code gives a simulated 40% discount; `WELCOME10` and `ATELIER20` provide additional sample promotions. Track the sample order `WBA-DEMO-0001` with `customer@demo.example`, or track a reference produced by demo checkout.

Edits, submissions and orders persist only in this browser and origin. Checkout charges no money. Email delivery, password reset, verification, phone and WhatsApp contact actions are simulated. Uploaded images become local data URLs (maximum 2 MB per file), subject to browser storage limits. Fonts and seed imagery are bundled locally. Existing social and map links remain ordinary outbound navigation links.

To reset only the demo data, run this in the browser console and reload:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith("wba_demo_"))
  .forEach((key) => localStorage.removeItem(key));
location.reload();
```

## Validation

```sh
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

`npm run preview` serves the production build. A static host must rewrite application routes to `index.html` for direct navigation and refreshes.

Optional browser verification uses the Playwright Python package and Chromium already installed in the Codex cloud environment. With the development server running:

```sh
python scripts/browser-smoke.py
python scripts/browser-interactions.py
```

The scripts save reports and screenshots under `/tmp/wearables-browser-checks`. `WEARABLES_BASE_URL`, `WEARABLES_CHROMIUM` and `WEARABLES_TEST_OUTPUT` can override their local defaults. These test tools are not application dependencies.

See [the conversion notes](docs/frontend-only.md) for the service boundary, removed integrations and simulation limits.

The original fullstack application is preserved unchanged on [`archive/original-fullstack`](https://github.com/Trust-Code-System/Wearables-Atelier/tree/archive/original-fullstack).
