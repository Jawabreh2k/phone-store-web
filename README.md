# Phone Store Web

Storefront and staff admin panel for a bilingual online store selling mobile phones and accessories. Arabic is the default language (right-to-left) and English is fully supported.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4. The data comes from the .NET API in [phone-store-api](https://github.com/Jawabreh2k/phone-store-api).

## Features

**Storefront**
- Home page, product listing, and product pages for phones and accessories
- Filters (category, price range, in stock) and sorting kept in the URL, so every filtered view can be shared and bookmarked; a filter column on desktop and a filter sheet on phones
- Variant picker for colour and storage, with price and stock per variant, and a swipeable photo gallery
- Cart and a step-by-step cash-on-delivery checkout for guests and signed-in customers
- Guest order tracking through a private link; signed-in customers see their orders and can cancel pending ones
- Sign-in and sign-up, sign-in with Google, and password reset
- Arabic and English with automatic language detection (cookie, then the browser's `Accept-Language`)

**Admin panel**
- Dashboard: today's sales, the order queue, a 14-day sales chart, top sellers, low stock, and recent orders
- Orders: filter, view, move through `Pending → Confirmed → Shipped → Delivered`, cancel or mark returned, and see each notification's delivery status
- Products: details in both languages, variants, specs, compatible phones for accessories, and photo upload with drag-and-drop reordering
- Brands, categories, and store settings (name, logo, contact numbers, currency, shipping fee, time zone, email alerts)

## How it is built

- **Server Components by default.** Pages fetch data on the server through a typed API client (`src/lib/api`); client components are used only where there is interaction (cart, forms, filters, gallery).
- **One origin for the browser.** `/api` and `/uploads` are rewritten to the .NET API, so the auth and cart cookies are first-party, no CORS is needed, and the API is never exposed directly.
- **Right-to-left first.** Layouts use logical Tailwind utilities (`ms-`, `pe-`, `start-`) so the same markup works in Arabic and English. Every string lives in `src/i18n/dictionaries/{ar,en}.json`, and the TypeScript types fail the build if the two files fall out of sync.
- **Design tokens.** Colours come from semantic tokens in `globals.css` (`bg-brand`, `text-muted`, …), so retheming the store means editing token values, not components.
- **Clear boundaries.** `app/` holds routes only; `components/ui` holds primitives; `components/layout` holds site chrome; `features/storefront` and `features/admin` hold feature code. An ESLint rule stops the storefront from importing admin code.
- **Errors in the customer's language.** The API returns a stable error `code`; the frontend maps it to a translated message, including per-field errors on forms.
- **Security headers** (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) on every response, and reset and tracking pages kept out of search engines.

## Project structure

```
src/app/[lang]/(shop)     storefront routes (home, products, cart, checkout, account, tracking)
src/app/[lang]/admin      admin login and the staff panel
src/components/ui         buttons, icons, form primitives
src/components/layout     header, footer, shells
src/features/storefront   storefront features (cart, checkout, variant picker, sign-in…)
src/features/admin        admin features (product editor, orders, dashboard, settings…)
src/i18n                  locales and the Arabic / English dictionaries
src/lib/api               typed API client
src/proxy.ts              sends locale-less URLs to the visitor's language
```

## Run locally

Prerequisites: Node 22, and the API running at http://localhost:5011 (see [phone-store-api](https://github.com/Jawabreh2k/phone-store-api)).

```bash
cp .env.example .env.local
npm install
npm run dev
```

The storefront is at http://localhost:3000 and the admin panel at http://localhost:3000/ar/admin.

`API_INTERNAL_URL` in `.env.local` is the server-to-server address of the API. `.env.example` has the local default.

```bash
npm run lint
npm run build
```
