"use client";

import { useParams } from "next/navigation";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { buttonPrimary } from "@/components/ui";

// Error boundaries are client components and cannot load server dictionaries; these mirror
// common.errorTitle / common.tryAgain in the dictionaries.
const text = {
  ar: { title: "حدث خطأ ما", retry: "حاول مرة أخرى" },
  en: { title: "Something went wrong", retry: "Try again" },
} as const;

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const copy = lang === "en" ? text.en : text.ar;

  return (
    <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-surface px-6 py-20 text-center sm:py-28">
      <div className="h-28 w-20" aria-hidden>
        <ProductImagePlaceholder name="" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
      <button type="button" onClick={reset} className={buttonPrimary}>
        {copy.retry}
      </button>
    </div>
  );
}
