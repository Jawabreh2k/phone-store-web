"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { AdminLogoutButton } from "@/features/admin/admin-logout-button";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { adminNavItems } from "@/lib/admin-nav";
import type { UserProfile } from "@/lib/api/types";
import { t } from "@/lib/format";
import { iconButton } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  profile: UserProfile;
  labels: Dictionary["admin"];
  pendingOrderCount?: number;
  children: React.ReactNode;
}

function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

function NavLinks({
  locale,
  labels,
  pathname,
  pendingOrderCount,
  onNavigate,
}: {
  locale: Locale;
  labels: Dictionary["admin"];
  pathname: string;
  pendingOrderCount: number;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label={labels.navLabel}>
      <ul className="flex flex-col gap-1">
        {adminNavItems.map(({ id, href, labelKey, Icon, isActive, groupStart }) => {
          const active = isActive(pathname);
          const badgeCount = id === "orders" ? pendingOrderCount : 0;
          const showBadge = badgeCount > 0;
          const linkLabel = showBadge ? t(labels.ordersNew, { count: badgeCount }) : labels.nav[labelKey];
          return (
            <li key={id} className={groupStart ? "mt-2 border-t border-border pt-2" : undefined}>
              <Link
                href={href(locale)}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={showBadge ? linkLabel : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-brand text-brand-foreground" : "text-foreground hover:bg-foreground/5"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">{labels.nav[labelKey]}</span>
                {showBadge && (
                  <span
                    aria-hidden
                    className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                      active ? "bg-brand-foreground text-brand" : "bg-accent text-brand-foreground"
                    }`}
                  >
                    {formatBadgeCount(badgeCount)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarContent({
  locale,
  profile,
  labels,
  pathname,
  pendingOrderCount,
  onNavigate,
}: {
  locale: Locale;
  profile: UserProfile;
  labels: Dictionary["admin"];
  pathname: string;
  pendingOrderCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4 sm:p-5">
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <span className="text-xs font-medium text-muted">{labels.staffTitle}</span>
        <span className="font-semibold tracking-tight">{profile.fullName}</span>
        <span dir="ltr" className="w-fit text-sm text-muted">
          {profile.email}
        </span>
      </div>

      <NavLinks locale={locale} labels={labels} pathname={pathname} pendingOrderCount={pendingOrderCount} onNavigate={onNavigate} />

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-5">
        <Suspense fallback={null}>
          <LanguageSwitcher label={labels.switchLanguage} className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground" />
        </Suspense>
        <AdminLogoutButton locale={locale} label={labels.logout} logoutFailedLabel={labels.logoutFailed} className="justify-start px-0" />
      </div>
    </div>
  );
}

function MobileNav({
  labels,
  sidebar,
}: {
  labels: Dictionary["admin"];
  sidebar: (close: () => void) => React.ReactNode;
}) {
  const drawerId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    drawerRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={drawerId}
          aria-label={open ? labels.menuClose : labels.menuOpen}
          onClick={() => setOpen((value) => !value)}
          className={iconButton}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <span className="font-semibold tracking-tight">{labels.staffTitle}</span>
        <span className="size-11" aria-hidden />
      </header>

      {open && <button type="button" aria-label={labels.menuClose} className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={close} />}

      <aside
        ref={drawerRef}
        id={drawerId}
        tabIndex={-1}
        className={`fixed inset-y-0 start-0 z-50 w-72 border-e border-border bg-surface transition-transform duration-200 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        {sidebar(close)}
      </aside>
    </>
  );
}

export function AdminShell({ locale, profile, labels, pendingOrderCount = 0, children }: Props) {
  const pathname = usePathname();

  const sidebarProps = { locale, profile, labels, pathname, pendingOrderCount };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <MobileNav key={pathname} labels={labels} sidebar={(close) => <SidebarContent {...sidebarProps} onNavigate={close} />} />

      <aside className="hidden w-72 shrink-0 border-e border-border bg-surface lg:block">
        <SidebarContent {...sidebarProps} />
      </aside>

      <main className="page-container min-w-0 flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
