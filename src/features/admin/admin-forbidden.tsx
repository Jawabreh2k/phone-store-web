import { LockIcon } from "@/components/ui/icons";
import { AdminLogoutButton } from "@/features/admin/admin-logout-button";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary } from "@/components/ui/ui";
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
