"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary, buttonSecondary } from "@/components/ui/ui";

// Error boundaries are client components and cannot load server dictionaries; these mirror
// common.errorTitle / common.tryAgain / common.backHome in the dictionaries.
const text = {
  ar: { title: "حدث خطأ ما", retry: "حاول مرة أخرى", home: "العودة للرئيسية" },
  en: { title: "Something went wrong", retry: "Try again", home: "Back to home" },
} as const;

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const locale = lang === "en" ? "en" : "ar";
  const copy = text[locale];

  return (
    <StatePanel visual={<AlertIcon className="size-10" />} tone="accent" title={copy.title}>
      <button type="button" onClick={reset} className={buttonPrimary}>
        {copy.retry}
      </button>
      <Link href={`/${locale}`} className={buttonSecondary}>
        {copy.home}
      </Link>
    </StatePanel>
  );
}
