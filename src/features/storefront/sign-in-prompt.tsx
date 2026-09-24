"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSession } from "@/features/storefront/session-provider";
import { SignInPanel } from "@/features/storefront/sign-in-panel";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { safeReturnPath, signInPromptParam } from "@/lib/sign-in-prompt";

interface Props {
  locale: Locale;
  labels: Dictionary["auth"];
}

/**
 * The sign-in dialog for account pages. A signed-out visitor to one is sent home with ?signIn=<that page>;
 * this opens the usual dialog there and, once signed in (here, with Google, or already), goes back to it.
 * Dismissing it drops the parameter so a reload doesn't reopen it.
 */
export function SignInPrompt({ locale, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const target = safeReturnPath(searchParams.get(signInPromptParam), locale);
  const sentTo = useRef<string | null>(null);

  const goToTarget = () => {
    if (!target || sentTo.current === target) return;
    sentTo.current = target;
    router.replace(target);
  };

  useEffect(() => {
    if (!target) sentTo.current = null;
    else if (status === "signedIn") goToTarget();
  });

  const dismiss = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete(signInPromptParam);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  };

  if (!target || pathname !== `/${locale}`) return null;

  return (
    <SignInPanel
      locale={locale}
      open={status === "signedOut"}
      onClose={dismiss}
      onSignedIn={goToTarget}
      returnUrl={target}
      labels={labels}
    />
  );
}
