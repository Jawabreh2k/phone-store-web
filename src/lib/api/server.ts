import "server-only";
import { headers } from "next/headers";
import type { Locale } from "@/i18n/config";
import { storefrontTags, type StorefrontTag } from "@/lib/storefront-tags";
import {
  ApiError,
  type AdminBrand,
  type AdminCategory,
  type AdminDashboard,
  type AdminOrderDetails,
  type AdminOrderListItem,
  type AdminProduct,
  type AdminProductListItem,
  type AdminProductSearch,
  type AdminSettings,
  type ApiProblem,
  type Brand,
  type Category,
  type OrderDetailsDto,
  type PagedResult,
  type ProductDetails,
  type ProductSearch,
  type ProductSummary,
  type PublicSettings,
  type UserProfile,
} from "./types";

export { ApiError };

const baseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:5011";

interface ReadOptions {
  /** Seconds the response may be served from Next's data cache. Catalogue data tolerates a short delay. */
  revalidate?: number;
  tag?: StorefrontTag;
  /** Bypass the data cache entirely (per-customer or credential-bearing responses). */
  noStore?: boolean;
  headers?: Record<string, string>;
}

/**
 * Server-side GET against the API. The language travels as ?lang= rather than a header
 * so it is part of the data-cache key, and Arabic and English responses never mix.
 */
async function get<T>(path: string, locale: Locale, query: Record<string, unknown> = {}, options: ReadOptions = {}): Promise<T | null> {
  const url = new URL(path, baseUrl);
  url.searchParams.set("lang", locale);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json", ...options.headers },
    ...(options.noStore
      ? { cache: "no-store" as const }
      : { next: { revalidate: options.revalidate ?? 60, tags: options.tag ? [options.tag] : undefined } }),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new ApiError(problem ?? { status: response.status, title: response.statusText });
  }

  return (await response.json()) as T;
}

/** Credential-bearing GET for staff routes. Forwards the browser cookie and never caches. */
async function getAuth<T>(
  path: string,
  locale: Locale,
  query: Record<string, unknown> = {},
): Promise<{ data: T | null; status: number }> {
  const url = new URL(path, baseUrl);
  url.searchParams.set("lang", locale);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const cookie = (await headers()).get("cookie");
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    cache: "no-store",
  });

  if (response.status === 404) return { data: null, status: 404 };
  if (response.status === 401) return { data: null, status: 401 };
  if (response.status === 403) return { data: null, status: 403 };
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new ApiError(problem ?? { status: response.status, title: response.statusText });
  }

  return { data: (await response.json()) as T, status: response.status };
}

function authRequired<T>(result: { data: T | null; status: number }, label: string): T {
  if (result.status === 401) throw new ApiError({ status: 401, title: "Unauthorized", code: "auth.unauthorized" });
  if (result.status === 403) throw new ApiError({ status: 403, title: "Forbidden", code: "auth.forbidden" });
  if (!result.data) throw new ApiError({ status: 500, title: `${label} failed` });
  return result.data;
}

export const api = {
  /**
   * Null when the API is unreachable, not just when unset: the root layout, header and footer read it,
   * and a throw there would take down every page (error.tsx can't catch its own layout) instead of
   * letting each page show its own error. Every caller already falls back to defaults.
   */
  settings: (locale: Locale) =>
    get<PublicSettings>("/api/settings", locale, {}, { revalidate: 300, tag: storefrontTags.settings }).catch((error: unknown) => {
      console.error("Store settings unavailable; using defaults.", error);
      return null;
    }),

  brands: (locale: Locale, type?: ProductSummary["type"]) =>
    get<Brand[]>("/api/catalog/brands", locale, { type }, { revalidate: 300, tag: storefrontTags.catalog }),

  categories: (locale: Locale, type?: ProductSummary["type"]) =>
    get<Category[]>("/api/catalog/categories", locale, { type }, { revalidate: 300, tag: storefrontTags.catalog }),

  products: (locale: Locale, search: ProductSearch = {}) =>
    get<PagedResult<ProductSummary>>("/api/catalog/products", locale, { ...search }, { tag: storefrontTags.catalog }),

  product: (locale: Locale, slug: string) =>
    get<ProductDetails>(`/api/catalog/products/${encodeURIComponent(slug)}`, locale, {}, { tag: storefrontTags.catalog }),

  /**
   * Guest order by tracking token; null when the token matches no order. The token is a credential,
   * so the response is never cached. `clientIp` keeps the API's per-IP tracking rate limit per customer
   * instead of shared by every visitor to this server.
   */
  trackOrder: (locale: Locale, token: string, clientIp?: string | null) =>
    get<OrderDetailsDto>(`/api/orders/track/${encodeURIComponent(token)}`, locale, {}, {
      noStore: true,
      headers: clientIp ? { "X-Forwarded-For": clientIp } : undefined,
    }),
};

export const adminApi = {
  me: (locale: Locale) =>
    getAuth<UserProfile>("/api/auth/me", locale).then((result) => ({ profile: result.data, status: result.status })),

  orders: (locale: Locale, search: { status?: string; search?: string; page?: number; pageSize?: number } = {}) =>
    getAuth<PagedResult<AdminOrderListItem>>("/api/admin/orders", locale, search).then((result) =>
      authRequired(result, "Orders list"),
    ),

  order: (locale: Locale, id: string) =>
    getAuth<AdminOrderDetails>(`/api/admin/orders/${encodeURIComponent(id)}`, locale).then((result) => {
      if (result.status === 404) return null;
      return authRequired(result, "Order detail");
    }),

  products: (locale: Locale, search: AdminProductSearch = {}) =>
    getAuth<PagedResult<AdminProductListItem>>("/api/admin/products", locale, { ...search }).then((result) =>
      authRequired(result, "Products list"),
    ),

  product: (locale: Locale, id: string) =>
    getAuth<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}`, locale).then((result) => {
      if (result.status === 404) return null;
      return authRequired(result, "Product detail");
    }),

  /** Every phone in the catalogue (published or not), for an accessory's "fits these phones" picker. */
  allPhones: async (locale: Locale): Promise<AdminProductListItem[]> => {
    const phones: AdminProductListItem[] = [];
    // The API caps a page at 100; a phone shop's range fits in a few pages, and the cap bounds a runaway loop.
    for (let page = 1; page <= 20; page++) {
      const result = await adminApi.products(locale, { type: "Phone", page, pageSize: 100 });
      phones.push(...result.items);
      if (!result.hasNextPage) break;
    }
    return phones;
  },

  brands: (locale: Locale) =>
    getAuth<AdminBrand[]>("/api/admin/brands", locale).then((result) => authRequired(result, "Brands")),

  categories: (locale: Locale) =>
    getAuth<AdminCategory[]>("/api/admin/categories", locale).then((result) => authRequired(result, "Categories")),

  settings: (locale: Locale) =>
    getAuth<AdminSettings>("/api/admin/settings", locale).then((result) => authRequired(result, "Settings")),

  dashboard: (locale: Locale) =>
    getAuth<AdminDashboard>("/api/admin/dashboard", locale).then((result) => authRequired(result, "Dashboard")),
};
