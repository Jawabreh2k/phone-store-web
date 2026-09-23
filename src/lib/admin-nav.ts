import type { Locale } from "@/i18n/config";
import { RouteIcon } from "@/components/icons";
import type { ComponentType } from "react";

export type AdminNavId = "orders";

export interface AdminNavItem {
  id: AdminNavId;
  href: (locale: Locale) => string;
  labelKey: "orders";
  Icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
}

/** Staff navigation. Add a tab here when a new admin section ships. */
export const adminNavItems: AdminNavItem[] = [
  {
    id: "orders",
    href: (locale) => `/${locale}/admin/orders`,
    labelKey: "orders",
    Icon: RouteIcon,
    isActive: (pathname) => pathname.includes("/admin/orders"),
  },
];
