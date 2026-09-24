# Phone Store Web: working notes

See README.md for how to run the storefront. The API is the separate `phone-store-api` repository.

## Web conventions
- Next.js 16: read `node_modules/next/dist/docs/` before using an API (middleware is now `proxy.ts`, `params` are Promises).
- Server Components by default; data via `src/lib/api/server.ts`. Client components only for interactivity.
- Every user-visible string goes in both `src/i18n/dictionaries/{ar,en}.json` (the types enforce parity).
- Use logical Tailwind utilities (`ms-`, `pe-`, `start-`) so RTL works; wrap mixed-script fragments in `<bdi>`.
- Colors come from the semantic tokens in `globals.css` (`bg-brand`, `text-muted`…), never raw palette classes. Light theme only for now; retinting = editing the token values.
- Buttons, chips, links and swipe rows use the shared class names in `src/components/ui.ts`; icons live in `src/components/icons.tsx` (`ArrowIcon` flips in RTL).
- Header logo: `settings.logoUrl` when set, else `public/logo.svg` (temporary mark); the store name is the home link's accessible name.
- Admin screens live under `app/[lang]/admin/(panel)/` (one layout does the staff check and renders `AdminShell`); add the tab in `lib/admin-nav.ts`. Editor cards are `AdminSection`s that each save on their own with a `SaveBar`; mutations go through `useAdminAction` (busy until the refreshed data lands, auth redirects; pass `storefront: "catalog" | "settings"` so the store's cached copy expires on save); modals use `AdminDialog`; fields use `admin-form-controls.tsx` (`Field`, `BilingualField`, `AdornedInput`…). Error copy comes from `admin.catalogErrors` / `admin.settings.errors` by API `code`.
- Header is `fixed` (`HeaderShell`, client): transparent at the top over the page's `bg-grid` background, and a blurred floating pill after 10px of scroll. `main` has `pt-24 sm:pt-28` to clear it; sticky elements must use `top-24` or more. The blur is allowed only on the header and its panels.
