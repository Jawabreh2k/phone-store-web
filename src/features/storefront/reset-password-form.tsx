"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary, fieldGroup, fieldHint, fieldInput, fieldLabel, formSection, textLink } from "@/components/ui/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { resetPassword } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { authErrorMessage } from "@/lib/auth-errors";

interface Props {
  locale: Locale;
  /** Both from the link in the reset email. */
  email: string;
  token: string;
  labels: Dictionary["auth"]["reset"];
  errors: Dictionary["auth"]["errors"];
}

/** New password + confirmation. The confirmation is checked here only; the API gets the password once. */
export function ResetPasswordForm({ locale, email, token, labels, errors }: Props) {
  const [done, setDone] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState<{ message: string; linkExpired: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);
  const passwordId = useId();
  const hintId = useId();
  const confirmId = useId();
  const mismatchId = useId();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const data = new FormData(event.currentTarget);
    const password = String(data.get("newPassword") ?? "");
    setError(null);
    if (password !== String(data.get("confirmPassword") ?? "")) {
      setMismatch(true);
      confirmRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(locale, email, token, password);
      setDone(true);
    } catch (err) {
      const linkExpired = err instanceof ApiError && err.problem.code === "auth.invalid_reset_token";
      setError({ message: authErrorMessage(err, errors), linkExpired });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <StatePanel visual={<CheckIcon className="size-10" />} title={labels.doneTitle} body={labels.doneBody}>
        <Link href={`/${locale}`} className={buttonPrimary}>
          {labels.continueShopping}
        </Link>
      </StatePanel>
    );
  }

  const [forBefore, forAfter] = labels.forAccount.split("{email}");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-3xl">{labels.title}</h1>
        <p className="text-sm text-muted">
          {forBefore}
          <bdi className="font-medium text-foreground">{email}</bdi>
          {forAfter}
        </p>
      </div>

      <form onSubmit={submit} className={formSection}>
        {/* Lets password managers file the new password under the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />

        <div className={fieldGroup}>
          <label htmlFor={passwordId} className={fieldLabel}>
            {labels.newPassword}
          </label>
          <input
            id={passwordId}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            aria-describedby={hintId}
            className={fieldInput}
          />
          <p id={hintId} className="text-xs leading-relaxed text-muted">
            {labels.passwordHint}
          </p>
        </div>

        <div className={fieldGroup}>
          <label htmlFor={confirmId} className={fieldLabel}>
            {labels.confirmPassword}
          </label>
          <input
            ref={confirmRef}
            id={confirmId}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            maxLength={128}
            onChange={() => setMismatch(false)}
            aria-invalid={mismatch || undefined}
            aria-describedby={mismatch ? mismatchId : undefined}
            className={fieldInput}
          />
          {mismatch && (
            <p id={mismatchId} className={fieldHint}>
              {labels.mismatch}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className={fieldHint}>
            {error.message}{" "}
            {error.linkExpired && (
              <Link href={`/${locale}/forgot-password`} className={textLink}>
                {labels.requestNewLink}
              </Link>
            )}
          </p>
        )}

        <button type="submit" disabled={submitting} className={buttonPrimary}>
          {submitting ? labels.saving : labels.submit}
        </button>
      </form>
    </div>
  );
}
