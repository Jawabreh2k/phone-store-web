import type { Metadata } from "next";
import { AdminForbidden } from "@/components/admin-forbidden";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminLoginShell } from "@/components/admin-login-shell";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getAdminGate } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.login.title };
}

export default async function AdminLoginPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const gate = await getAdminGate(locale);

  if (gate.kind === "admin") redirect(`/${locale}/admin/orders`);

  return (
    <AdminLoginShell labels={dict.admin}>
      {gate.kind === "forbidden" ? (
        <AdminForbidden locale={locale} labels={dict.admin.forbidden} logoutFailedLabel={dict.admin.logoutFailed} />
      ) : (
        <AdminLoginForm locale={locale} labels={dict.admin.login} loadingLabel={dict.admin.loading} />
      )}
    </AdminLoginShell>
  );
}
