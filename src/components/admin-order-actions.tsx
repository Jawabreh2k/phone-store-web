"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import { adminOrderErrorMessage } from "@/lib/admin-errors";
import { redirectOnAdminAuthFailure } from "@/lib/admin-client-auth";
import { ApiError, type OrderStatus } from "@/lib/api/types";
import { buttonPrimary, buttonSecondary, fieldGroup, fieldHint, fieldInput, fieldLabel, panel, panelTitle } from "./ui";

interface Props {
  locale: Locale;
  orderId: string;
  nextStatuses: OrderStatus[];
  labels: Dictionary["admin"]["orders"];
  loadingLabel: string;
}

function actionLabel(status: OrderStatus, labels: Dictionary["admin"]["orders"]): string {
  const map: Partial<Record<OrderStatus, string>> = {
    Confirmed: labels.actionConfirm,
    Shipped: labels.actionShip,
    Delivered: labels.actionDeliver,
    Cancelled: labels.actionCancel,
  };
  return map[status] ?? status;
}

export function AdminOrderActions({ locale, orderId, nextStatuses, labels, loadingLabel }: Props) {
  const router = useRouter();
  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [pending, startTransition] = useTransition();

  const applyStatus = async (status: OrderStatus) => {
    setError(null);
    setBusy(status);
    try {
      await adminApi.changeOrderStatus(locale, orderId, status, note.trim() || null);
      setNote("");
      cancelDialogRef.current?.close();
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      if (redirectOnAdminAuthFailure(err, locale, router)) return;
      setError(adminOrderErrorMessage(err, labels.errors));
      if (err instanceof ApiError) {
        const code = err.problem.code;
        if (code === "orders.invalid_transition" || code === "orders.cannot_cancel") {
          startTransition(() => router.refresh());
        }
      }
    } finally {
      setBusy(null);
    }
  };

  const openCancelDialog = () => {
    const dialog = cancelDialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("[data-cancel-confirm]")?.focus();
  };

  useEffect(() => {
    const dialog = cancelDialogRef.current;
    if (!dialog) return;
    const onCancel = () => dialog.close();
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, []);

  const onAction = (status: OrderStatus) => {
    if (status === "Cancelled") {
      openCancelDialog();
      return;
    }
    void applyStatus(status);
  };

  if (nextStatuses.length === 0) return null;

  const disabled = busy !== null || pending;

  return (
    <section aria-labelledby="admin-order-actions" className={`${panel} p-5 sm:p-6`}>
      <h2 id="admin-order-actions" className={panelTitle}>
        {labels.actions}
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        <div className={fieldGroup}>
          <label htmlFor="admin-status-note" className={fieldLabel}>
            {labels.actionNote}
          </label>
          <textarea
            id="admin-status-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            className={fieldInput}
          />
          <p className="text-xs text-muted">{labels.actionNoteHint}</p>
        </div>

        {error && (
          <p role="alert" className={fieldHint}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onAction(status)}
              disabled={disabled}
              className={status === "Cancelled" ? buttonSecondary : buttonPrimary}
            >
              {busy === status || pending ? loadingLabel : actionLabel(status, labels)}
            </button>
          ))}
        </div>
      </div>

      <dialog ref={cancelDialogRef} aria-labelledby="cancel-title" aria-describedby="cancel-body" className="w-[min(100%,28rem)] rounded-card border border-border bg-surface p-0 shadow-float backdrop:bg-foreground/20">
        <form method="dialog" className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-2">
            <h3 id="cancel-title" className="text-lg font-semibold tracking-tight">
              {labels.confirmCancelTitle}
            </h3>
            <p id="cancel-body" className="text-sm leading-relaxed text-muted">
              {labels.confirmCancelBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" data-cancel-confirm disabled={disabled} onClick={() => void applyStatus("Cancelled")} className={buttonPrimary}>
              {busy === "Cancelled" || pending ? loadingLabel : labels.confirmCancelConfirm}
            </button>
            <button type="submit" disabled={disabled} className={buttonSecondary}>
              {labels.confirmCancelBack}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
