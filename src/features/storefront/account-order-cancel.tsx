"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AlertIcon, CloseIcon } from "@/components/ui/icons";
import { buttonPrimary, buttonSecondary, fieldGroup, fieldInput, fieldLabel, iconButton, notice } from "@/components/ui/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { cancelMyOrder } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import { signInPromptUrl } from "@/lib/sign-in-prompt";

interface Props {
  locale: Locale;
  orderNumber: string;
  /** From the API: true only while the order is Pending. */
  canCancel: boolean;
  labels: Dictionary["account"]["cancel"];
  errors: Dictionary["account"]["errors"];
}

/** Codes after which the page is out of date (the store confirmed it meanwhile), so it is reloaded. */
const staleCodes = new Set(["orders.customer_cancel_pending_only", "orders.not_found"]);

function errorMessage(error: unknown, errors: Props["errors"]): string {
  const code = error instanceof ApiError ? error.problem.code : undefined;
  return code && code in errors ? errors[code as keyof Props["errors"]] : errors.generic;
}

/**
 * "Cancel order" with a confirm step. Stays mounted when the order can no longer be cancelled, so an error
 * (the store confirmed it in the meantime) is still shown after the refreshed page drops the button.
 */
export function AccountOrderCancel({ locale, orderNumber, canCancel, labels, errors }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const busy = submitting || refreshing;
  const titleId = useId();
  const bodyId = useId();
  const reasonId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    if (!busy) setOpen(false);
  };

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await cancelMyOrder(locale, orderNumber, reason.trim() || null);
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      if (err instanceof ApiError && err.problem.status === 401) {
        router.replace(signInPromptUrl(locale, pathname));
        return;
      }
      setError(errorMessage(err, errors));
      if (err instanceof ApiError && err.problem.code && staleCodes.has(err.problem.code)) {
        setOpen(false);
        startTransition(() => router.refresh());
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCancel && !error) return null;

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      {error && !open && (
        <p role="alert" className={notice}>
          <AlertIcon />
          {error}
        </p>
      )}

      {canCancel && (
        <div className="flex flex-col gap-2 sm:items-end">
          <button type="button" onClick={() => setOpen(true)} disabled={busy} className={`${buttonSecondary} w-full sm:w-auto`}>
            {refreshing ? labels.cancelling : labels.button}
          </button>
          <p className="text-xs text-muted">{labels.hint}</p>
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-[28rem] rounded-panel border border-border bg-surface p-0 text-foreground shadow-float backdrop:bg-foreground/35 not-open:hidden motion-safe:open:animate-dialog-in"
      >
        {open && (
          <div className="relative flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-y-auto p-6 sm:p-7">
            <button type="button" aria-label={labels.close} onClick={close} disabled={busy} className={`${iconButton} absolute end-4 top-4`}>
              <CloseIcon />
            </button>
            <div className="flex flex-col gap-2 pe-12">
              <h2 id={titleId} className="text-xl font-semibold tracking-tight">
                {labels.title}
              </h2>
              <p id={bodyId} className="text-sm leading-relaxed text-muted">
                {labels.body}
              </p>
            </div>

            <div className={fieldGroup}>
              <label htmlFor={reasonId} className={fieldLabel}>
                {labels.reason}
              </label>
              <textarea
                id={reasonId}
                rows={3}
                maxLength={500}
                value={reason}
                disabled={busy}
                onChange={(event) => setReason(event.target.value)}
                className={fieldInput}
              />
            </div>

            {error && (
              <p role="alert" className={notice}>
                <AlertIcon />
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} disabled={busy} className={buttonSecondary}>
                {labels.keep}
              </button>
              <button type="button" onClick={() => void confirm()} disabled={busy} className={buttonPrimary}>
                {busy ? labels.cancelling : labels.confirm}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
