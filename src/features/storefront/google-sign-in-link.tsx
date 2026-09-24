import { GoogleIcon } from "@/components/ui/icons";
import { buttonSecondary } from "@/components/ui/ui";
import type { Locale } from "@/i18n/config";
import { googleConnectUrl, googleSignInUrl } from "@/lib/api/client";

interface Props {
  locale: Locale;
  /** Local path to land on afterwards, signed in (or with ?authError=<code>). */
  returnUrl: string;
  label: string;
  /** Signed-in "Connect Google" instead of a fresh sign-in. */
  connect?: boolean;
  /** Replaces the full-width secondary button look, e.g. for a row in the account menu. */
  className?: string;
}

/**
 * "Continue with Google", for both the sign-in and create-account modes. A plain <a>, not next/link or fetch:
 * the sign-in is a chain of full-page redirects through the API and Google (see googleSignInUrl).
 */
export function GoogleSignInLink({ locale, returnUrl, label, connect = false, className = `${buttonSecondary} w-full` }: Props) {
  const href = connect ? googleConnectUrl(locale, returnUrl) : googleSignInUrl(locale, returnUrl);
  return (
    <a href={href} className={className}>
      <GoogleIcon className="size-[1.125rem]" />
      {label}
    </a>
  );
}

/** Rule with a centred "or" between the email form and the Google button. */
export function SignInDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span aria-hidden className="h-px flex-1 bg-border" />
      {label}
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
