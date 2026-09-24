/**
 * Data-cache tags on the storefront's reads (lib/api/server.ts). A staff save expires one through
 * refreshStorefront (lib/admin-actions.ts), so the change shows on the store's next page view instead of
 * after the read's revalidate window.
 */
export const storefrontTags = {
  /** Store name, logo, contact numbers, delivery rules. */
  settings: "settings",
  /** Brands, categories, product lists and product pages. */
  catalog: "catalog",
} as const;

export type StorefrontTag = (typeof storefrontTags)[keyof typeof storefrontTags];
