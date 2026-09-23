import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Dictionary } from "@/i18n/dictionaries";

interface Props {
  labels: Pick<Dictionary["admin"], "staffTitle" | "switchLanguage" | "login">;
  children: React.ReactNode;
}

/** Standalone staff sign-in surface: no sidebar, no shop chrome. */
export function AdminLoginShell({ labels, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="page-container flex h-14 items-center justify-between gap-4">
        <span className="font-semibold tracking-tight">{labels.staffTitle}</span>
        <Suspense fallback={null}>
          <LanguageSwitcher label={labels.switchLanguage} />
        </Suspense>
      </header>

      <main className="page-container flex flex-1 flex-col items-center justify-center py-10">
        <div className="mb-8 max-w-md text-center">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight sm:text-4xl">{labels.login.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{labels.login.subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
