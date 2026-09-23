import "server-only";
import { headers } from "next/headers";
import type { Locale } from "@/i18n/config";
import {
  ApiError,
  type AdminOrderDetails,
  type AdminOrderListItem,
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
    ...(options.noStore ? { cache: "no-store" as const } : { next: { revalidate: options.revalidate ?? 60 } }),
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
    get<PublicSettings>("/api/settings", locale, {}, { revalidate: 300 }).catch((error: unknown) => {
      console.error("Store settings unavailable; using defaults.", error);
      return null;
    }),

  brands: (locale: Locale, type?: ProductSummary["type"]) =>
    get<Brand[]>("/api/catalog/brands", locale, { type }, { revalidate: 300 }),

  categories: (locale: Locale, type?: ProductSummary["type"]) =>
    get<Category[]>("/api/catalog/categories", locale, { type }, { revalidate: 300 }),

  products: (locale: Locale, search: ProductSearch = {}) =>
    get<PagedResult<ProductSummary>>("/api/catalog/products", locale, { ...search }),

  product: (locale: Locale, slug: string) =>
    get<ProductDetails>(`/api/catalog/products/${encodeURIComponent(slug)}`, locale),

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
};
