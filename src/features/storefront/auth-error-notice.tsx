"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertIcon, CloseIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import { authErrorParam } from "@/lib/api/client";
import { authErrorFromCode } from "@/lib/auth-errors";

interface Props {
  errors: Dictionary["auth"]["errors"];
  dismissLabel: string;
}

/**
 * Explains a failed Google sign-in. The API sends the browser back to where it started with ?authError=<code>.
 * The code is read once on arrival (a full page load) and then dropped from the address bar, so a reload or a
 * shared link doesn't show it again. Like the header's panels, the notice belongs to the page it arrived on.
 */
export function AuthErrorNotice({ errors, dismissLabel }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [shown, setShown] = useState(() => {
    const code = searchParams.get(authErrorParam);
    return code ? { code, path: pathname } : null;
  });

  useEffect(() => {
    if (!searchParams.has(authErrorParam)) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(authErrorParam);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [searchParams]);

  if (!shown || shown.path !== pathname) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-24 z-40 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-accent/25 bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-lg shadow-foreground/10 sm:top-28"
    >
      <AlertIcon className="mt-0.5 size-4 shrink-0 text-accent" />
      <p className="flex-1">{authErrorFromCode(shown.code, errors)}</p>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={() => setShown(null)}
        className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <CloseIcon className="size-3.5" />
      </button>
    </div>
  );
}
