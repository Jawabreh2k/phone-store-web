import Link from "next/link";
import { buttonPrimary } from "@/components/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

/** Unknown or malformed tracking token. Explains that the link from checkout is the only way in. */
export default async function TrackOrderNotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-surface px-6 py-20 text-center sm:py-28">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{dict.track.notFoundTitle}</h1>
      <p className="max-w-md text-muted">{dict.track.notFoundBody}</p>
      <Link href={`/${locale}`} className={buttonPrimary}>
        {dict.common.backHome}
      </Link>
    </div>
  );
}
