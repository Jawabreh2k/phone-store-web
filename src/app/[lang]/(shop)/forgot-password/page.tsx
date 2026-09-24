import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/storefront/forgot-password-form";
import { GoogleSignInLink, SignInDivider } from "@/features/storefront/google-sign-in-link";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.auth.forgot.title, robots: { index: false, follow: true } };
}

/** Standalone "forgot password" step. The sign-in panel shows the same form inline. */
export default async function ForgotPasswordPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-4 sm:py-8">
      <ForgotPasswordForm locale={locale} labels={dict.auth.forgot} errors={dict.auth.errors} titleAs="h1" />
      <SignInDivider label={dict.auth.google.or} />
      <GoogleSignInLink locale={locale} returnUrl={`/${locale}`} label={dict.auth.google.continue} />
    </div>
  );
}
