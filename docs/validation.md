# Conversion validation

Validated locally in the Codex cloud environment on 11 October 2026 with Node.js 24.19.0 and npm 11.9.0, without backend environment variables or credentials.

| Check | Result |
| --- | --- |
| Frozen dependency installation (`npm ci --include=dev`) | Passed; dependency versions retained, Supabase removed, missing optional native packages recorded in lockfile |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with zero errors and 28 existing console warnings |
| `npm run test:coverage` | 60 tests passed across 3 files; 89.87% lines, 84.53% branches, 93.75% functions in frontend libraries |
| `npm run build` | Passed without backend credentials |
| Production browser route checks | 118 checks: 59 customer/admin routes and route examples at both 1440×1000 and 390×844 |
| Browser workflow checks | 10 checks covering storefront-to-admin operations, local uploads and simulated contact actions |
| Runtime, HTTP, assets and outbound requests | No runtime errors, missing images, HTTP errors or external requests in the final production route run |
| Responsive viewport checks | No page-wide horizontal overflow at either tested width; wide admin tables remain in scrolling containers |
| Representative visual comparison | Home, shop, product detail, about and contact matched the archived UI at both tested widths, using identical sample data and locally bundled font files; intentional demo notice excluded |
| Repository review | Original routes, theme/style sheets, layouts and image assets retained; mock service boundaries reviewed for network calls, password storage, date restoration and local mutation behavior |

Browser workflow checks exercised wishlist persistence, cart persistence, discounted simulated checkout and confirmation activity, contact form submission, demo admin login, an order status update reflected in tracking, enquiries appearing in admin messages, product edits reflected in shop/home, a local image upload, and interception of external communication actions. The unit tests cover other CRUD operations, coupon limits, review approval, flyer activation, role changes, pagination and storage failure handling.

The snapshot comparison uses an exported copy of the archive with intercepted service responses, not a live backend. It does not establish pixel equality against unknown production backend data or every interactive state. The archive branch itself is unchanged. Remote GitHub Actions status has not been verified; these are local test results.

The original empty-cart redirect and stale shop filtering could hide working data during reloads. The conversion waits for cart hydration, protects confirmation navigation from the empty-cart redirect, and recalculates product filters when mock data arrives. A minimal width constraint keeps populated admin tables from widening the mobile page.
