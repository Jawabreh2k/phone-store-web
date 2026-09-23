# Phone Store Web

Next.js 16 storefront for a mobile phone shop. Arabic is the default language, English is available, and the layout is RTL-aware. Catalog data comes from the `phone-store-api` repository.

## Run locally

Prerequisites: Node 22, and the API running at http://localhost:5011.

```bash
cp .env.example .env.local
npm install
npm run dev
```

The storefront is at http://localhost:3000. The browser talks only to the Next.js origin; `/api` and `/uploads` are rewritten to the API, so auth and cart cookies stay first-party.

`API_INTERNAL_URL` in `.env.local` is the server-to-server address of the API. `.env.example` has the local default.
