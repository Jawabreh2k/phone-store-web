"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary, buttonSecondary } from "@/components/ui/ui";
import ar from "@/i18n/dictionaries/ar.json";
import en from "@/i18n/dictionaries/en.json";

export default function AdminErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const labels = (lang === "en" ? en : ar).admin.error;

  return (
    <StatePanel visual={<AlertIcon className="size-10" />} tone="accent" title={labels.title}>
      <button type="button" onClick={reset} className={buttonPrimary}>
        {labels.retry}
      </button>
      <Link href={`/${lang === "en" ? "en" : "ar"}/admin/dashboard`} className={buttonSecondary}>
        {labels.backToDashboard}
      </Link>
    </StatePanel>
  );
}
