import { LockIcon } from "@/components/icons";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { StatePanel } from "@/components/state-panel";
import { buttonPrimary } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface Props {
  locale: Locale;
  labels: Dictionary["admin"]["forbidden"];
  logoutFailedLabel: string;
}

export function AdminForbidden({ locale, labels, logoutFailedLabel }: Props) {
  return (
    <StatePanel visual={<LockIcon className="size-10" />} tone="accent" title={labels.title} body={labels.body}>
      <AdminLogoutButton locale={locale} label={labels.logout} logoutFailedLabel={logoutFailedLabel} className={buttonPrimary} />
    </StatePanel>
  );
}
