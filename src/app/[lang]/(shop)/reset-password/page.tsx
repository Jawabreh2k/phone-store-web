import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/storefront/reset-password-form";
import { LockIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  // The URL carries a reset token: keep it out of search results.
  return { title: dict.auth.reset.title, robots: { index: false, follow: false } };
}

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || null;

/** Landing page of the link in the password reset email: /{lang}/reset-password?email=…&token=… */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/[lang]/reset-password">) {
  const [locale, dict, query] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const email = single(query.email);
  const token = single(query.token);

  if (!email || !token) {
    return (
      <StatePanel visual={<LockIcon className="size-10" />} title={dict.auth.reset.incompleteTitle} body={dict.auth.reset.incompleteBody}>
        <Link href={`/${locale}/forgot-password`} className={buttonPrimary}>
          {dict.auth.reset.requestNewLink}
        </Link>
      </StatePanel>
    );
  }

  return <ResetPasswordForm locale={locale} email={email} token={token} labels={dict.auth.reset} errors={dict.auth.errors} />;
}
