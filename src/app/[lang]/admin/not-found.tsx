import Link from "next/link";
import { RouteIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function AdminNotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <StatePanel visual={<RouteIcon className="size-10" />} title={dict.admin.orders.notFoundTitle} body={dict.admin.orders.notFoundBody}>
      <Link href={`/${locale}/admin/orders`} className={buttonPrimary}>
        {dict.admin.orders.backToList}
      </Link>
    </StatePanel>
  );
}
