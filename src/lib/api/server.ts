import "server-only";
import type { Locale } from "@/i18n/config";
import type { ApiProblem, Brand, PagedResult, ProductDetails, ProductSearch, ProductSummary, PublicSettings } from "./types";

const baseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:5011";

export class ApiError extends Error {
  constructor(readonly problem: ApiProblem) {
    super(problem.title);
    this.name = "ApiError";
  }
}

interface ReadOptions {
  /** Seconds the response may be served from Next's data cache. Catalogue data tolerates a short delay. */
  revalidate?: number;
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
    headers: { Accept: "application/json" },
    next: { revalidate: options.revalidate ?? 60 },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new ApiError(problem ?? { status: response.status, title: response.statusText });
  }

  return (await response.json()) as T;
}

export const api = {
  settings: (locale: Locale) => get<PublicSettings>("/api/settings", locale, {}, { revalidate: 300 }),

  brands: (locale: Locale, type?: ProductSummary["type"]) =>
    get<Brand[]>("/api/catalog/brands", locale, { type }, { revalidate: 300 }),

  products: (locale: Locale, search: ProductSearch = {}) =>
    get<PagedResult<ProductSummary>>("/api/catalog/products", locale, { ...search }),

  product: (locale: Locale, slug: string) =>
    get<ProductDetails>(`/api/catalog/products/${encodeURIComponent(slug)}`, locale),
};
