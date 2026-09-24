import Link from "next/link";
import { PhoneIcon } from "@/components/icons";
import { StatePanel } from "@/components/state-panel";
import { buttonPrimary } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function AdminProductNotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const labels = dict.admin.products;

  return (
    <StatePanel visual={<PhoneIcon className="size-10" />} title={labels.notFoundTitle} body={labels.notFoundBody}>
      <Link href={`/${locale}/admin/products`} className={buttonPrimary}>
        {dict.admin.productEditor.back}
      </Link>
    </StatePanel>
  );
}
