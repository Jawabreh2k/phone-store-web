"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon } from "@/components/ui/icons";
import { buttonPrimary, fieldGroup, fieldHint, fieldInput, fieldLabel, iconButton, textLink } from "@/components/ui/ui";
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
  /** Where Google sends the customer back to; defaults to the current page. */
  returnUrl?: string;
  /** Called instead of onClose after a successful sign-in or sign-up. */
  onSignedIn?: () => void;
}

type Mode = "signIn" | "signUp" | "forgot";

const ease = "ease-[cubic-bezier(0.2,0.7,0.2,1)]";

/** How long the height morph runs; the clip stays on until it finishes so focus rings aren't cut. */
const REVEAL_MS = 420;

/**
 * Height morph used by the 21st.dev auth form: a row animates between 0fr and 1fr so the dialog
 * grows and shrinks instead of swapping screens. Collapsed content stays mounted (autofill) but inert.
 * Overflow is hidden only while the row is shut or still moving — an open row lets the focus ring
 * (2px outline, 3px offset) draw outside the button instead of being sliced by the card.
 */
function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  const [clip, setClip] = useState(!open);

  useEffect(() => {
    if (!open) {
      setClip(true);
      return;
    }
    const frame = window.setTimeout(() => setClip(false), REVEAL_MS);
    return () => window.clearTimeout(frame);
  }, [open]);

  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows] duration-[420ms] ${ease} motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
    >
      <div className={clip ? "overflow-hidden" : "overflow-visible"}>
        <div
          className={`transition-[opacity,transform] duration-300 ${ease} motion-reduce:translate-y-0 motion-reduce:transition-none ${
            open ? "translate-y-0 opacity-100 delay-75" : "translate-y-1.5 opacity-0 delay-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Centred sign-in dialog. Creating an account expands the same form; forgot-password swaps in with the same motion. */
export function SignInPanel({ locale, open, onClose, labels, returnUrl, onSignedIn }: Props) {
  const { signIn, signUp } = useSession();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("signIn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generation, setGeneration] = useState(0);
  const signInHeadingId = useId();
  const signUpHeadingId = useId();
  const forgotHeadingId = useId();
  const errorId = useId();

  // Each open starts clean: a stray password or error from a previous visit shouldn't reappear. Reset during
  // render (not in an effect) so it lands before the first paint, with no extra render in between.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setGeneration((value) => value + 1);
      setMode("signIn");
      setFullName("");
      setEmail("");
      setPassword("");
      setError(null);
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-auth-focus='email']")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const signingUp = mode === "signUp";
  const headingId = mode === "forgot" ? forgotHeadingId : signingUp ? signUpHeadingId : signInHeadingId;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  useEffect(() => {
    if (!open) return;
    const focus = mode === "signUp" ? "name" : mode === "forgot" ? "forgot" : "email";
    dialogRef.current?.querySelector<HTMLElement>(`[data-auth-focus='${focus}']`)?.focus();
  }, [mode, open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (signingUp) {
        await signUp(fullName.trim(), email.trim(), password);
      } else {
        await signIn(email.trim(), password, rememberMe);
      }
      if (onSignedIn) onSignedIn();
      else onClose();
    } catch (err) {
      setError(authErrorMessage(err, labels.errors));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      className="pointer-events-auto m-auto w-[calc(100%-2rem)] max-w-[26rem] rounded-panel border border-border bg-surface p-0 text-foreground shadow-float backdrop:bg-foreground/35 not-open:hidden motion-safe:open:animate-dialog-in"
    >
      {/* Scroll lives inside a padded frame so a focused button's ring stays inside the card, not sliced by it. */}
      <div key={generation} className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto px-6 pt-6 pb-7 sm:px-8 sm:pt-7">
        <button
          type="button"
          aria-label={labels.dismiss}
          onClick={onClose}
          disabled={submitting}
          className={`${iconButton} absolute end-4 top-4`}
        >
          <CloseIcon />
        </button>

        <Reveal open={mode !== "forgot"}>
          <div className="flex flex-col gap-6">
            <div className="grid text-center">
              <div
                className={`col-start-1 row-start-1 flex flex-col gap-2 px-8 transition-[opacity,transform] duration-300 ${ease} motion-reduce:transition-none ${
                  mode === "signIn" ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
                }`}
                aria-hidden={mode !== "signIn"}
              >
                <h2 id={signInHeadingId} className="text-[1.75rem] leading-tight font-semibold tracking-tight">
                  {labels.signIn.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted">{labels.signIn.subtitle}</p>
              </div>
              <div
                className={`col-start-1 row-start-1 flex flex-col gap-2 px-8 transition-[opacity,transform] duration-300 ${ease} motion-reduce:transition-none ${
                  signingUp ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
                }`}
                aria-hidden={!signingUp}
              >
                <h2 id={signUpHeadingId} className="text-[1.75rem] leading-tight font-semibold tracking-tight">
                  {labels.signUp.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted">{labels.signUp.subtitle}</p>
              </div>
            </div>

            <GoogleSignInLink locale={locale} returnUrl={returnUrl ?? pathname} label={labels.google.continue} />
            <SignInDivider label={labels.google.or} />

            <form onSubmit={submit} className="flex flex-col">
              <Reveal open={signingUp}>
                <div className={`${fieldGroup} mb-4`}>
                  <label htmlFor={`${signUpHeadingId}-name`} className={fieldLabel}>
                    {labels.signUp.fullName}
                  </label>
                  <input
                    id={`${signUpHeadingId}-name`}
                    data-auth-focus="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required={signingUp}
                    maxLength={120}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={fieldInput}
                  />
                </div>
              </Reveal>

              <div className={`${fieldGroup} mb-4`}>
                <label htmlFor={`${signInHeadingId}-email`} className={fieldLabel}>
                  {labels.signIn.email}
                </label>
                <input
                  id={`${signInHeadingId}-email`}
                  data-auth-focus="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  required
                  maxLength={256}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-describedby={error ? errorId : undefined}
                  className={`${fieldInput} text-start`}
                />
              </div>

              <div className="mb-4">
                <div className={fieldGroup}>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={`${signInHeadingId}-password`} className={fieldLabel}>
                      {labels.signIn.password}
                    </label>
                    {mode === "signIn" && (
                      <button type="button" onClick={() => switchMode("forgot")} className={textLink}>
                        {labels.forgot.link}
                      </button>
                    )}
                  </div>
                  <input
                    id={`${signInHeadingId}-password`}
                    name="password"
                    type="password"
                    dir="ltr"
                    autoComplete={signingUp ? "new-password" : "current-password"}
                    required
                    minLength={signingUp ? 8 : undefined}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-describedby={error ? errorId : undefined}
                    className={`${fieldInput} text-start`}
                  />
                </div>
                <Reveal open={signingUp}>
                  <p className="mt-2 text-xs text-muted">{labels.reset.passwordHint}</p>
                </Reveal>
              </div>

              <Reveal open={mode === "signIn"}>
                <label className="mb-4 flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="size-4 accent-brand" />
                  {labels.signIn.rememberMe}
                </label>
              </Reveal>

              {error && (
                <p id={errorId} role="alert" className={`${fieldHint} mb-4`}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className={`${buttonPrimary} w-full`}>
                <span className="grid">
                  <span className={`col-start-1 row-start-1 transition-opacity duration-200 ${mode === "signIn" ? "opacity-100" : "opacity-0"}`} aria-hidden={mode !== "signIn"}>
                    {submitting && mode === "signIn" ? labels.signIn.submitting : labels.signIn.submit}
                  </span>
                  <span className={`col-start-1 row-start-1 transition-opacity duration-200 ${signingUp ? "opacity-100" : "opacity-0"}`} aria-hidden={!signingUp}>
                    {submitting && signingUp ? labels.signUp.submitting : labels.signUp.submit}
                  </span>
                </span>
              </button>
            </form>

            <button type="button" onClick={() => switchMode(signingUp ? "signIn" : "signUp")} className="self-center text-sm text-muted">
              <span className="grid text-center">
                <span className={`col-start-1 row-start-1 transition-opacity duration-200 ${mode === "signIn" ? "opacity-100" : "opacity-0"}`} aria-hidden={mode !== "signIn"}>
                  {labels.signIn.noAccount} <span className={textLink}>{labels.signIn.createAccount}</span>
                </span>
                <span className={`col-start-1 row-start-1 transition-opacity duration-200 ${signingUp ? "opacity-100" : "opacity-0"}`} aria-hidden={!signingUp}>
                  {labels.signUp.haveAccount} <span className={textLink}>{labels.signUp.signInLink}</span>
                </span>
              </span>
            </button>
          </div>
        </Reveal>

        <Reveal open={mode === "forgot"}>
          <div className="px-8 pt-4">
            <ForgotPasswordForm
              locale={locale}
              labels={labels.forgot}
              errors={labels.errors}
              titleAs="h2"
              titleId={forgotHeadingId}
              onBack={() => switchMode("signIn")}
            />
          </div>
        </Reveal>
      </div>
    </dialog>
  );
}
