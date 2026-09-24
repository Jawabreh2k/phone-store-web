import type { Locale } from "@/i18n/config";
import { DashboardIcon, GearIcon, GridIcon, PhoneIcon, RouteIcon, TagIcon } from "@/components/icons";
import type { ComponentType } from "react";

export type AdminNavId = "dashboard" | "orders" | "products" | "brands" | "categories" | "settings";

export interface AdminNavItem {
  id: AdminNavId;
  href: (locale: Locale) => string;
  labelKey: AdminNavId;
  Icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
  /** Starts a new group in the sidebar (a divider above it). */
  groupStart?: boolean;
}

const section = (id: AdminNavId, Icon: AdminNavItem["Icon"], groupStart?: boolean): AdminNavItem => ({
  id,
  href: (locale) => `/${locale}/admin/${id}`,
  labelKey: id,
  Icon,
  isActive: (pathname) => pathname.includes(`/admin/${id}`),
  groupStart,
});

/** Staff navigation: selling, then the catalogue, then the store itself. Add a tab here when a section ships. */
export const adminNavItems: AdminNavItem[] = [
  section("dashboard", DashboardIcon, true),
  section("orders", RouteIcon),
  section("products", PhoneIcon, true),
  section("brands", TagIcon),
  section("categories", GridIcon),
  section("settings", GearIcon, true),
];
