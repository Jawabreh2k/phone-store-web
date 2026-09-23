import "server-only";
import type { Locale } from "@/i18n/config";
import { ApiError, type ApiProblem, type Brand, type OrderDetailsDto, type PagedResult, type ProductDetails, type ProductSearch, type ProductSummary, type PublicSettings } from "./types";

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
