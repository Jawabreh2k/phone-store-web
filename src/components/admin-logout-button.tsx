"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import { ApiError } from "@/lib/api/types";
import { buttonGhost } from "./ui";

export function AdminLogoutButton({
  locale,
  label,
  logoutFailedLabel,
  className = `${buttonGhost} h-9 px-3 text-sm`,
}: {
  locale: Locale;
  label: string;
  logoutFailedLabel: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    setError(null);
    setBusy(true);
    try {
      await adminApi.logout(locale);
      router.replace(`/${locale}/admin/login`);
    } catch (err) {
      if (err instanceof ApiError && err.problem.status === 401) {
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError(logoutFailedLabel);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={() => void signOut()} disabled={busy} className={className}>
        {busy ? "…" : label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
