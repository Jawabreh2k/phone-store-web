"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { hasLocale, localeCookie } from "@/i18n/config";

/** Links to the same page in the other language and remembers the choice for the proxy. */
export function LanguageSwitcher({
  label,
  className = "text-sm text-muted hover:text-foreground",
}: {
  label: string;
  className?: string;
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
      onClick={() => {
        document.cookie = `${localeCookie}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={className}
    >
      {label}
    </Link>
  );
}
