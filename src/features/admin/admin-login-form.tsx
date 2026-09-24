"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import { adminLoginErrorMessage } from "@/lib/admin-errors";
import { buttonPrimary, fieldGroup, fieldHint, fieldInput, fieldLabel, formSection } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  labels: Dictionary["admin"]["login"];
  loadingLabel: string;
}

export function AdminLoginForm({ locale, labels, loadingLabel }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const rememberMe = data.get("rememberMe") === "on";

    try {
      await adminApi.login(locale, email, password, rememberMe);
      router.replace(`/${locale}/admin/dashboard`);
    } catch (err) {
      setError(adminLoginErrorMessage(err, labels.errors));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${formSection} w-full max-w-md`} aria-labelledby="admin-login-title">
      <div className={fieldGroup}>
        <label htmlFor="admin-email" className={fieldLabel}>
          {labels.email}
        </label>
        <input id="admin-email" name="email" type="email" autoComplete="username" required className={fieldInput} />
      </div>

      <div className={fieldGroup}>
        <label htmlFor="admin-password" className={fieldLabel}>
          {labels.password}
        </label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required className={fieldInput} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input name="rememberMe" type="checkbox" className="size-4 rounded border-border accent-brand" />
        {labels.rememberMe}
      </label>

      {error && (
        <p role="alert" className={fieldHint}>
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className={buttonPrimary}>
        {submitting ? loadingLabel : labels.submit}
      </button>
    </form>
  );
}
