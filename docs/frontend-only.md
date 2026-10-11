# Frontend-only conversion

The conversion keeps the routed customer pages, all admin pages, layouts, components, styles and responsive breakpoints. The mock catalog copies the original storefront descriptions, prices, sizes, details and local image paths. Visible changes identify demo operation, explain simulated results, and provide sample sign-in details; they do not define the scope of the future backend.

## Service boundary and local state

- `src/app/lib/db.ts` preserves the async functions consumed by the existing UI. It now reads and updates typed browser data instead of making database calls. Shared model types are in `types.ts`.
- `mockData.ts` provides the original ten-product catalog. `mockStore.ts` seeds related admin data and manages the versioned `wba_demo_v1` local-storage record. Reads return detached copies. Model dates are restored on reload. Failed writes report storage errors without committing partial changes.
- The storefront, customer submissions and admin operations use the same local records. Customer summaries and dashboard statistics derive from sample orders. Product edits flow through to the shop and featured homepage section. Reviews remain pending until approved, coupons enforce their local expiry and usage limits, and only one flyer can be active.
- `auth.ts` provides simulated session, profile, registration, sign-out and verification operations. Demo role checks use the local admin list. Password text is never persisted or used as a real credential. Existing cart and wishlist reducers retain identity-specific browser state, with separate demo storage keys.
- `payment.ts` simulates checkout and records the order and coupon use together before the cart is cleared. Totals are calculated from cart items and validated local coupons, rather than trusting a discount supplied in the URL. Payment references are explicitly prefixed `DEMO`.
- `email.ts` records simulated activity and returns simulated broadcast counts. It never sends requests or emails. Contact, telephone and WhatsApp links show a local simulation notice rather than sending users into a real communication flow.
- `uploads.ts` reads image files into data URLs without uploading them. The media library and edited products can reuse these local previews.

These modules form replacement points for a future API. No new backend endpoints, business features or backend feature scope have been assumed.

## Removed integrations

Removed the Supabase client and npm dependency (including its transitive packages), database queries and RPC calls, hosted auth sessions, cloud storage uploads, Edge Function calls, Resend email integration, Paystack script loading and credential requirements, SQL migrations, Supabase configuration and deploy scripts, Firebase rules, backend environment examples and CI secrets/deployment jobs. Removed unused, unrouted Next.js scaffolding and its duplicate catalog. Frontend validation, error utilities, logger, route definitions and state reducers remain.

The npm lockfile is refreshed after removing Supabase and now includes the native optional packages that were missing from the original lockfile, allowing `npm ci` to succeed. CI runs the frontend checks and production build without secrets. Original font families are bundled as WOFF2 assets from Fontsource 5.3.0; their OFL licenses are included in `public/fonts`.

## Simulation limits

Real identity verification, password security, permission enforcement, transactional database persistence, cross-user data sharing, email delivery, payment collection/refunds, image hosting, messaging/calls, courier booking and real shipment tracking require a backend or external services. Their existing UI flows are retained as local simulations where practical. Browser storage can be cleared or edited by the user, and uploaded data URLs are not public hosted URLs. No real operational outcome should be inferred from a demo success message.

## Original archive and review

The untouched original `main` commit `86359ba518e4d016b796375f5ce72e82b5f6385e` was pushed to `archive/original-fullstack` before editing. The conversion is developed separately on `refactor/frontend-only`. The archived branch must not be changed. Merge the conversion into `main` only after its tests and review are complete.
