"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon } from "@/components/ui/icons";
import { buttonGhost, buttonPrimary, fieldGroup, fieldHint, fieldInput, fieldLabel, textLink } from "@/components/ui/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { authErrorMessage } from "@/lib/auth-errors";
import { useSession } from "@/features/storefront/session-provider";
import { ForgotPasswordForm } from "@/features/storefront/forgot-password-form";
import { GoogleSignInLink, SignInDivider } from "@/features/storefront/google-sign-in-link";

interface Props {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  labels: Dictionary["auth"];
}

type Mode = "signIn" | "signUp" | "forgot";

/** Right-anchored slide-in panel (left in RTL) with sign in, create account and forgot-password as one flow. */
export function SignInPanel({ locale, open, onClose, labels }: Props) {
  const { signIn, signUp } = useSession();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("signIn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const headingId = useId();
  const errorId = useId();

  // Each open starts clean: a stray password or error from a previous visit shouldn't reappear. Reset during
  // render (not in an effect) so it lands before the first paint, with no extra render in between.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode("signIn");
      setFullName("");
      setEmail("");
      setPassword("");
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signUp") {
        await signUp(fullName.trim(), email.trim(), password);
      } else {
        await signIn(email.trim(), password, rememberMe);
      }
      onClose();
    } catch (err) {
      setError(authErrorMessage(err, labels.errors));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" aria-label={labels.dismiss} onClick={onClose} className="pointer-events-auto fixed inset-0 z-40 bg-foreground/20" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="pointer-events-auto fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto border-s border-border bg-surface p-6 shadow-float outline-none sm:p-8"
      >
        <button type="button" aria-label={labels.dismiss} onClick={onClose} className={`${buttonGhost} self-end px-2`}>
          <CloseIcon />
        </button>

        {mode === "forgot" ? (
          <ForgotPasswordForm locale={locale} labels={labels.forgot} errors={labels.errors} titleAs="h2" onBack={() => switchMode("signIn")} />
        ) : (
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h2 id={headingId} className="text-[1.75rem] leading-tight font-semibold tracking-tight">
                {mode === "signUp" ? labels.signUp.title : labels.signIn.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{mode === "signUp" ? labels.signUp.subtitle : labels.signIn.subtitle}</p>
            </div>

            <GoogleSignInLink locale={locale} returnUrl={pathname} label={labels.google.continue} />
            <SignInDivider label={labels.google.or} />

            <form onSubmit={submit} className="flex flex-col gap-4">
              {mode === "signUp" && (
                <div className={fieldGroup}>
                  <label htmlFor={`${headingId}-name`} className={fieldLabel}>
                    {labels.signUp.fullName}
                  </label>
                  <input
                    id={`${headingId}-name`}
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={fieldInput}
                  />
                </div>
              )}

              <div className={fieldGroup}>
                <label htmlFor={`${headingId}-email`} className={fieldLabel}>
                  {labels.signIn.email}
                </label>
                <input
                  id={`${headingId}-email`}
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  required
                  maxLength={256}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`${fieldInput} text-start`}
                />
              </div>

              <div className={fieldGroup}>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={`${headingId}-password`} className={fieldLabel}>
                    {labels.signIn.password}
                  </label>
                  {mode === "signIn" && (
                    <button type="button" onClick={() => switchMode("forgot")} className={textLink}>
                      {labels.forgot.link}
                    </button>
                  )}
                </div>
                <input
                  id={`${headingId}-password`}
                  name="password"
                  type="password"
                  dir="ltr"
                  autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                  required
                  minLength={mode === "signUp" ? 8 : undefined}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${fieldInput} text-start`}
                />
                {mode === "signUp" && <p className="text-xs text-muted">{labels.reset.passwordHint}</p>}
              </div>

              {mode === "signIn" && (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="size-4 accent-brand" />
                  {labels.signIn.rememberMe}
                </label>
              )}

              {error && (
                <p id={errorId} role="alert" className={fieldHint}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className={buttonPrimary}>
                {submitting ? (mode === "signUp" ? labels.signUp.submitting : labels.signIn.submitting) : mode === "signUp" ? labels.signUp.submit : labels.signIn.submit}
              </button>
            </form>

            <button type="button" onClick={() => switchMode(mode === "signUp" ? "signIn" : "signUp")} className="self-center text-sm text-muted">
              {mode === "signUp" ? labels.signUp.haveAccount : labels.signIn.noAccount}{" "}
              <span className={textLink}>{mode === "signUp" ? labels.signUp.signInLink : labels.signIn.createAccount}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
