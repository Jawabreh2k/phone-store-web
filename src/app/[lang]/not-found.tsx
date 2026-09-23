import Link from "next/link";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { buttonPrimary } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function NotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-surface px-6 py-20 text-center sm:py-28">
      <div className="h-28 w-20" aria-hidden>
        <ProductImagePlaceholder name="" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{dict.common.notFoundTitle}</h1>
      <p className="max-w-sm text-muted">{dict.common.notFoundBody}</p>
      <Link href={`/${locale}`} className={buttonPrimary}>
        {dict.common.backHome}
      </Link>
    </div>
  );
}
