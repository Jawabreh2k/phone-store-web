import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { ApiError, type AdminVariant, type LocalizedText, type ProductType } from "@/lib/api/types";
import { storageLabel } from "@/lib/variants";

// ---------- Limits mirrored from the API (Store.Domain) so forms can say no before a round trip ----------

export const productLimits = {
  nameMax: 200,
  descriptionMax: 8000,
  slugMax: 120,
  skuMax: 64,
  colorNameMax: 50,
  specLabelMax: 100,
  specValueMax: 500,
  maxImages: 12,
  maxVariants: 50,
  maxSpecifications: 60,
  maxStock: 100_000,
  imageMaxBytes: 5 * 1024 * 1024,
} as const;

/** GetAdminProductsHandler.LowStockThreshold: at or below this many units a variant counts as running low. */
export const lowStockThreshold = 5;

export const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

// ---------- List filters in the URL ----------

export const productTypes: ProductType[] = ["Phone", "Accessory"];
export const productStatusFilters = ["published", "draft", "lowStock", "noPhotos", "outOfStock"] as const;
export type ProductStatusFilter = (typeof productStatusFilters)[number];

export type AdminProductsListParams = {
  search?: string;
  type?: ProductType;
  brand?: string;
  status?: ProductStatusFilter;
  page?: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function pick(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value || undefined;
}

export function parseAdminProductsListParams(params: SearchParams): AdminProductsListParams {
  const type = pick(params, "type");
  const status = pick(params, "status");
  const page = Math.max(1, Number(pick(params, "page")) || 1);

  return {
    search: pick(params, "search"),
    type: productTypes.includes(type as ProductType) ? (type as ProductType) : undefined,
    brand: pick(params, "brand"),
    status: productStatusFilters.includes(status as ProductStatusFilter) ? (status as ProductStatusFilter) : undefined,
    page: page > 1 ? page : undefined,
  };
}

export function adminProductsListQuery(params: AdminProductsListParams): string {
  const next = new URLSearchParams();
  if (params.search) next.set("search", params.search);
  if (params.type) next.set("type", params.type);
  if (params.brand) next.set("brand", params.brand);
  if (params.status) next.set("status", params.status);
  if (params.page && params.page > 1) next.set("page", String(params.page));
  const query = next.toString();
  return query ? `?${query}` : "";
}

export function adminProductsListHref(locale: Locale, params: AdminProductsListParams): string {
  return `/${locale}/admin/products${adminProductsListQuery(params)}`;
}

// ---------- Slugs and SKUs ----------

/** Same rules as Store.Domain.Common.Slug.From, so the preview matches what the API stores. */
export function slugify(text: string): string {
  const normalized = text.trim().toLowerCase().normalize("NFKD");
  let out = "";
  for (const c of normalized) {
    if ((c >= "a" && c <= "z") || (c >= "0" && c <= "9")) out += c;
    else if (/\s/.test(c) || "-_./+".includes(c)) out += "-";
  }
  const slug = out.replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  return slug.length > productLimits.slugMax ? slug.slice(0, productLimits.slugMax).replace(/-+$/, "") : slug;
}

export const isValidSlug = (value: string) => value.length <= productLimits.slugMax && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const isValidSku = (value: string) => value.length <= productLimits.skuMax && /^[A-Za-z0-9._-]+$/.test(value);

/** "iphone-16-pro" + 256 GB + Black → "IPHONE-16-PRO-256-BLACK". A starting point staff can edit. */
export function suggestSku(slug: string, options: { storageGb: number | null; colorEn: string }): string {
  const parts = [slug, options.storageGb ? String(options.storageGb) : "", slugify(options.colorEn)].filter(Boolean);
  return parts.join("-").toUpperCase().slice(0, productLimits.skuMax).replace(/-+$/, "");
}

// ---------- Display ----------

export const localized = (text: LocalizedText, locale: Locale) => (locale === "ar" ? text.ar : text.en) || text.en || text.ar;

/** "256 GB · 8 GB RAM · Black", as the storefront and orders describe a variant. */
export function describeVariant(variant: Pick<AdminVariant, "storageGb" | "ramGb" | "color">, locale: Locale, ramTemplate: string): string {
  const parts: string[] = [];
  if (variant.storageGb) parts.push(storageLabel(variant.storageGb));
  if (variant.ramGb) parts.push(ramTemplate.replace("{ram}", `${variant.ramGb} GB`));
  if (variant.color) parts.push(localized(variant.color, locale));
  return parts.join(" · ");
}

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(units: number): StockLevel {
  if (units <= 0) return "out";
  return units <= lowStockThreshold ? "low" : "ok";
}

/** Whole-percent saving shown next to a sale price; null when there is no valid compare-at price. */
export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  if (!compareAtPrice || !(price > 0) || compareAtPrice <= price) return null;
  return Math.round((1 - price / compareAtPrice) * 100);
}

/** Reads a number typed with Latin or Arabic-Indic digits ("١٬٢٩٩٫٥" → 1299.5); NaN when it isn't one. */
export function parseNumber(text: string): number {
  const latin = text
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[,٬\s]/g, "")
    .replace(/٫/g, ".");
  return /^\d+(\.\d+)?$/.test(latin) ? Number(latin) : Number.NaN;
}

/** At most three decimals (fils), the precision the API stores money in. */
export const hasMoneyPrecision = (value: number) => Math.abs(Math.round(value * 1000) - value * 1000) < 1e-6;

/** A price back into the text field, without float noise ("499.5" rather than "499.50000001"). */
export const formatNumberInput = (value: number | null) => (value === null ? "" : String(Number(value.toFixed(3))));

// ---------- Errors ----------

type ProductErrors = Dictionary["admin"]["catalogErrors"];

/** The API's stable error code ("catalog.sku_taken"), or undefined for network and unknown errors. */
export const errorCode = (error: unknown): string | undefined => (error instanceof ApiError ? error.problem.code : undefined);

/** Localized message for a failed product call, by the API's stable error code. */
export function catalogErrorMessage(error: unknown, errors: ProductErrors): string {
  const code = errorCode(error);
  return code && code in errors ? errors[code as keyof ProductErrors] : errors.generic;
}

/** The API's field errors ("name.en", "variant.price") when the call failed validation, else null. */
export function apiFieldErrors(error: unknown): Record<string, string[]> | null {
  if (!(error instanceof ApiError) || error.problem.code !== "validation") return null;
  return error.problem.errors ?? null;
}
