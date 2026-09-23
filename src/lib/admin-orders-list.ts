import type { Locale } from "@/i18n/config";
import type { OrderStatus } from "@/lib/api/types";

export const adminOrderStatuses: OrderStatus[] = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export type AdminOrdersListParams = {
  status?: OrderStatus;
  search?: string;
  page?: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function pick(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value || undefined;
}

export function parseAdminOrdersListParams(params: SearchParams): AdminOrdersListParams {
  const statusRaw = pick(params, "status");
  const status = adminOrderStatuses.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined;
  const search = pick(params, "search");
  const page = Math.max(1, Number(pick(params, "page")) || 1);

  return { status, search, page: page > 1 ? page : undefined };
}

export function adminOrdersListQuery(params: AdminOrdersListParams): string {
  const next = new URLSearchParams();
  if (params.search) next.set("search", params.search);
  if (params.status) next.set("status", params.status);
  if (params.page && params.page > 1) next.set("page", String(params.page));
  const query = next.toString();
  return query ? `?${query}` : "";
}

export function adminOrdersListHref(locale: Locale, params: AdminOrdersListParams): string {
  return `/${locale}/admin/orders${adminOrdersListQuery(params)}`;
}
