import type { Locale } from "@/i18n/config";
import {
  ApiError,
  type AdminSpecification,
  type ApiProblem,
  type OrderStatus,
  type ProductImage,
  type SaveBrandRequest,
  type SaveCategoryRequest,
  type SaveProductRequest,
  type UpdateSettingsRequest,
  type UserProfile,
  type VariantInput,
} from "./types";

function apiUrl(path: string, locale: Locale): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("lang", locale);
  return url.pathname + url.search;
}

async function requestJson<T>(path: string, locale: Locale, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path, locale), {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      // JSON bodies only: a FormData upload must let the browser set its multipart boundary.
      ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ApiProblem | null;
    throw new ApiError(problem ?? { status: response.status, title: response.statusText });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const productPath = (productId: string, rest = "") => `/api/admin/products/${encodeURIComponent(productId)}${rest}`;

export function login(locale: Locale, email: string, password: string, rememberMe: boolean): Promise<UserProfile> {
  return requestJson<UserProfile>("/api/auth/login", locale, json("POST", { email, password, rememberMe }));
}

export function logout(locale: Locale): Promise<void> {
  return requestJson<void>("/api/auth/logout", locale, { method: "POST" });
}

export function changeOrderStatus(locale: Locale, orderId: string, status: OrderStatus, note?: string | null): Promise<void> {
  return requestJson<void>(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, locale, json("POST", { status, note: note || null }));
}

/** Sends a stopped (parked) message again. */
export function retryNotification(locale: Locale, notificationId: string): Promise<void> {
  return requestJson<void>(`/api/admin/notifications/${encodeURIComponent(notificationId)}/retry`, locale, { method: "POST" });
}

// ---- Products ----

/** Creates an unpublished product without variants; resolves to its id. */
export function createProduct(locale: Locale, body: SaveProductRequest): Promise<string> {
  return requestJson<string>("/api/admin/products", locale, json("POST", body));
}

export function updateProduct(locale: Locale, productId: string, body: SaveProductRequest): Promise<string> {
  return requestJson<string>(productPath(productId), locale, json("PUT", body));
}

export function setProductPublished(locale: Locale, productId: string, published: boolean): Promise<void> {
  return requestJson<void>(productPath(productId, published ? "/publish" : "/unpublish"), locale, { method: "POST" });
}

export function addVariant(locale: Locale, productId: string, variant: VariantInput, stockQuantity: number): Promise<string> {
  return requestJson<string>(productPath(productId, "/variants"), locale, json("POST", { variant, stockQuantity }));
}

export function updateVariant(locale: Locale, productId: string, variantId: string, variant: VariantInput, isActive: boolean): Promise<void> {
  return requestJson<void>(productPath(productId, `/variants/${encodeURIComponent(variantId)}`), locale, json("PUT", { variant, isActive }));
}

/** Positive adds units (a delivery), negative removes them (a stock count, damage). */
export function adjustStock(locale: Locale, productId: string, variantId: string, delta: number): Promise<void> {
  return requestJson<void>(productPath(productId, `/variants/${encodeURIComponent(variantId)}/stock`), locale, json("POST", { delta }));
}

export function replaceSpecifications(locale: Locale, productId: string, specifications: AdminSpecification[]): Promise<void> {
  return requestJson<void>(productPath(productId, "/specifications"), locale, json("PUT", specifications));
}

export function setCompatiblePhones(locale: Locale, productId: string, phoneProductIds: string[]): Promise<void> {
  return requestJson<void>(productPath(productId, "/compatibility"), locale, json("PUT", phoneProductIds));
}

export function uploadProductImage(locale: Locale, productId: string, file: File): Promise<ProductImage> {
  const body = new FormData();
  body.append("file", file);
  return requestJson<ProductImage>(productPath(productId, "/images"), locale, { method: "POST", body });
}

export function removeProductImage(locale: Locale, productId: string, imageId: string): Promise<void> {
  return requestJson<void>(productPath(productId, `/images/${encodeURIComponent(imageId)}`), locale, { method: "DELETE" });
}

export function reorderProductImages(locale: Locale, productId: string, imageIds: string[]): Promise<void> {
  return requestJson<void>(productPath(productId, "/images/order"), locale, json("PUT", imageIds));
}

// ---- Brands & categories ----

export function saveBrand(locale: Locale, brandId: string | null, body: SaveBrandRequest): Promise<string> {
  return brandId
    ? requestJson<string>(`/api/admin/brands/${encodeURIComponent(brandId)}`, locale, json("PUT", body))
    : requestJson<string>("/api/admin/brands", locale, json("POST", body));
}

/** Every brand id, in the order customers should see them. */
export function reorderBrands(locale: Locale, brandIds: string[]): Promise<void> {
  return requestJson<void>("/api/admin/brands/order", locale, json("PUT", brandIds));
}

/** Only for a brand no product uses (otherwise 409 catalog.brand_in_use). */
export function deleteBrand(locale: Locale, brandId: string): Promise<void> {
  return requestJson<void>(`/api/admin/brands/${encodeURIComponent(brandId)}`, locale, { method: "DELETE" });
}

export function saveCategory(locale: Locale, categoryId: string | null, body: SaveCategoryRequest): Promise<string> {
  return categoryId
    ? requestJson<string>(`/api/admin/categories/${encodeURIComponent(categoryId)}`, locale, json("PUT", body))
    : requestJson<string>("/api/admin/categories", locale, json("POST", body));
}

/** The ids of one product type's categories, in their new order. */
export function reorderCategories(locale: Locale, categoryIds: string[]): Promise<void> {
  return requestJson<void>("/api/admin/categories/order", locale, json("PUT", categoryIds));
}

export function deleteCategory(locale: Locale, categoryId: string): Promise<void> {
  return requestJson<void>(`/api/admin/categories/${encodeURIComponent(categoryId)}`, locale, { method: "DELETE" });
}

// ---- Store settings ----

export function updateSettings(locale: Locale, body: UpdateSettingsRequest): Promise<void> {
  return requestJson<void>("/api/admin/settings", locale, json("PUT", body));
}

/** Resolves to the new logo's URL; the previous file is deleted by the API. */
export function uploadStoreLogo(locale: Locale, file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  return requestJson<string>("/api/admin/settings/logo", locale, { method: "POST", body });
}

export function removeStoreLogo(locale: Locale): Promise<void> {
  return requestJson<void>("/api/admin/settings/logo", locale, { method: "DELETE" });
}
