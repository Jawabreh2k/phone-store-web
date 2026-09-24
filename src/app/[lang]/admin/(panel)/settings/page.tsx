import type { Metadata } from "next";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { pageTitle } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { handleAdminReadError } from "@/lib/admin-auth";
import { adminApi } from "@/lib/api/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.admin.settings.title };
}

export default async function AdminSettingsPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const labels = dict.admin.settings;

  let settings;
  try {
    settings = await adminApi.settings(locale);
  } catch (error) {
    handleAdminReadError(error, locale);
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex max-w-xl flex-col gap-2">
        <h1 className={pageTitle}>{labels.title}</h1>
        <p className="text-sm leading-relaxed text-muted">{labels.subtitle}</p>
      </header>
      <AdminSettingsForm
        locale={locale}
        settings={settings}
        labels={labels}
        saveBarLabels={dict.admin.saveBar}
        languages={dict.admin.languages}
        deliveryLabels={dict.home}
      />
    </div>
  );
}
