import Link from "next/link";
import { RouteIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary } from "@/components/ui/ui";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

/** Unknown or malformed tracking token. Explains that the link from checkout is the only way in. */
export default async function TrackOrderNotFound() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <StatePanel visual={<RouteIcon className="size-10" />} title={dict.track.notFoundTitle} body={dict.track.notFoundBody}>
      <Link href={`/${locale}`} className={buttonPrimary}>
        {dict.common.backHome}
      </Link>
    </StatePanel>
  );
}
