import { AdminForbidden } from "@/features/admin/admin-forbidden";
import { AdminShell } from "@/features/admin/admin-shell";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getAdminGate, redirectToAdminLogin } from "@/lib/admin-auth";

/** Every staff screen except sign-in: checks the session once, then renders the sidebar shell. */
export default async function AdminPanelLayout({ children }: LayoutProps<"/[lang]/admin">) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const gate = await getAdminGate(locale);

  if (gate.kind === "anonymous") redirectToAdminLogin(locale);
  if (gate.kind === "forbidden") {
    return <AdminForbidden locale={locale} labels={dict.admin.forbidden} logoutFailedLabel={dict.admin.logoutFailed} />;
  }

  return (
    <AdminShell locale={locale} profile={gate.profile} labels={dict.admin}>
      {children}
    </AdminShell>
  );
}
