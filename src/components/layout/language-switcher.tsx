"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GlobeIcon } from "@/components/ui/icons";
import { hasLocale, localeCookie } from "@/i18n/config";

/** Links to the same page in the other language and remembers the choice for the proxy. */
export function LanguageSwitcher({
  label,
  className = "inline-flex items-center gap-2 text-sm font-medium leading-none text-muted hover:text-foreground",
  iconClassName = "size-[1.125rem] shrink-0",
  iconOnly = false,
}: {
  /** Accessible name, e.g. "Switch to Arabic" / "English". */
  label: string;
  className?: string;
  iconClassName?: string;
  /** Icon without visible text (header toolbar). */
  iconOnly?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [, current = "", ...rest] = pathname.split("/");
  const target = hasLocale(current) && current === "ar" ? "en" : "ar";
  const query = searchParams.toString();
  const href = `/${[target, ...rest].join("/")}${query ? `?${query}` : ""}`;

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={label}
      onClick={() => {
        document.cookie = `${localeCookie}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={className}
    >
      <GlobeIcon className={iconClassName} />
      {!iconOnly && <span>{label}</span>}
    </Link>
  );
}
