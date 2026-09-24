"use client";

import { useId, useState, type FormEvent } from "react";
import { BackArrowIcon, MailIcon } from "@/components/ui/icons";
import { buttonGhost, buttonPrimary, fieldGroup, fieldHint, fieldInput, fieldLabel, formSection } from "@/components/ui/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { requestPasswordReset } from "@/lib/api/client";
import { authErrorMessage } from "@/lib/auth-errors";

interface Props {
  locale: Locale;
  labels: Dictionary["auth"]["forgot"];
  errors: Dictionary["auth"]["errors"];
  /** h1 on its own page; h2 as a step inside the sign-in dialog. */
  titleAs?: "h1" | "h2";
  /** Inside the sign-in dialog: shows "Back to sign in" and drops the extra card. */
  onBack?: () => void;
  /** Id for the dialog's accessible name while this step is showing. */
  titleId?: string;
}

/**
 * Asks for the account email and has a reset link sent to it. The confirmation reads the same whether or not the
 * email has an account (the API never says), so the form can't be used to find out who shops here.
 */
export function ForgotPasswordForm({ locale, labels, errors, titleAs: Title = "h2", onBack, titleId }: Props) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailId = useId();
  const errorId = useId();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const address = email.trim();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(locale, address);
      setSentTo(address);
    } catch (err) {
      setError(authErrorMessage(err, errors));
    } finally {
      setSubmitting(false);
    }
  };

  // The address is Latin inside a possibly Arabic sentence, so it goes in its own <bdi>.
  const [sentBefore, sentAfter] = labels.sentBody.split("{email}");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <Title id={titleId} className="text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-3xl">
          {sentTo ? labels.sentTitle : labels.title}
        </Title>
        {!sentTo && <p className="text-sm leading-relaxed text-muted">{labels.subtitle}</p>}
      </div>

      {sentTo ? (
        <div role="status" className={`${onBack ? "flex flex-col gap-4" : formSection} items-center text-center`}>
          <span aria-hidden className="inline-flex size-12 items-center justify-center rounded-full bg-brand/5 text-brand">
            <MailIcon className="size-5" />
          </span>
          <p className="text-sm leading-relaxed">
            {sentBefore}
            <bdi className="font-medium">{sentTo}</bdi>
            {sentAfter}
          </p>
          <button type="button" onClick={() => setSentTo(null)} className={buttonGhost}>
            {labels.useAnotherEmail}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className={onBack ? "flex flex-col gap-4" : formSection}>
          <div className={fieldGroup}>
            <label htmlFor={emailId} className={fieldLabel}>
              {labels.email}
            </label>
            <input
              id={emailId}
              data-auth-focus="forgot"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={256}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={error ? errorId : undefined}
              className={fieldInput}
            />
          </div>

          {error && (
            <p id={errorId} role="alert" className={fieldHint}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className={onBack ? `${buttonPrimary} w-full` : buttonPrimary}>
            {submitting ? labels.sending : labels.submit}
          </button>
        </form>
      )}

      {onBack && (
        <button type="button" onClick={onBack} className={`${buttonGhost} self-center`}>
          <BackArrowIcon />
          {labels.back}
        </button>
      )}
    </div>
  );
}
