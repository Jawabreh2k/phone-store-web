import Link from "next/link";
import { ListIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

/** Unknown order number, or one that belongs to someone else: the API answers both the same way. */
export default async function AccountOrderNotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <StatePanel visual={<ListIcon className="size-10" />} title={dict.account.notFoundTitle} body={dict.account.notFoundBody}>
      <Link href={`/${locale}/account/orders`} className={buttonPrimary}>
        {dict.account.backToOrders}
      </Link>
    </StatePanel>
  );
}
