"use client";

import { useState } from "react";
import { AdminDialog } from "@/features/admin/admin-dialog";
import { AdminSection } from "@/features/admin/admin-section";
import { AlertIcon, MailIcon } from "@/components/ui/icons";
import { LocalDateTime } from "@/components/ui/local-date-time";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { apiErrorMessage } from "@/lib/admin-errors";
import * as adminApi from "@/lib/api/admin-client";
import { ApiError, type AdminNotification, type OutboxStatus } from "@/lib/api/types";
import { useAdminAction } from "@/lib/use-admin-action";
import { badgeAccent, badgeBrand, badgeMuted, badgeSuccess, buttonGhost, buttonPrimary, buttonSecondary, notice } from "@/components/ui/ui";

type Labels = Dictionary["admin"]["orders"]["messages"];

interface Props {
  locale: Locale;
  /** Null when the list could not be loaded; the rest of the order screen still works. */
  messages: AdminNotification[] | null;
  labels: Labels;
  closeLabel: string;
}

const statusBadge: Record<OutboxStatus, string> = {
  Pending: badgeMuted,
  Processing: badgeBrand,
  Sent: badgeSuccess,
  Parked: badgeAccent,
};

function templateLabel(message: AdminNotification, labels: Labels): string {
  return message.template ? labels.template[message.template] : labels.template.other;
}

function channelLabel(message: AdminNotification, labels: Labels): string {
  return message.channel ? labels.channel[message.channel] : labels.channel.none;
}

/**
 * The order's outgoing messages (customer updates, the staff alert) with their delivery state, and "Send again"
 * for a message that stopped retrying. Contents and links never reach this screen: the API only returns state.
 */
export function AdminOrderMessages({ locale, messages, labels, closeLabel }: Props) {
  const { run, reload, busy } = useAdminAction(locale);
  const [openId, setOpenId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  const open = messages?.find((m) => m.id === openId) ?? null;

  const retry = async (id: string) => {
    setError(null);
    setRetryingId(id);
    const result = await run(() => adminApi.retryNotification(locale, id));
    setRetryingId(null);
    if (result.ok) return;

    setError({ id, message: apiErrorMessage(result.error, labels.errors) });
    // Someone (or the worker) got there first: show the current state.
    if (result.error instanceof ApiError && (result.error.problem.code === "outbox.not_parked" || result.error.problem.code === "outbox.not_found")) {
      reload();
    }
  };

  const retryButton = (message: AdminNotification, className: string) => (
    <button type="button" onClick={() => void retry(message.id)} disabled={busy} className={className}>
      {retryingId === message.id ? labels.retrying : labels.retry}
    </button>
  );

  return (
    <AdminSection id="admin-order-messages" title={labels.title} description={labels.description} icon={<MailIcon />}>
      {messages === null ? (
        <p role="alert" className={notice}>
          <AlertIcon />
          {labels.loadError}
        </p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted">{labels.empty}</p>
      ) : (
        <ul className="-my-3 flex flex-col divide-y divide-border">
          {messages.map((message) => (
            <li key={message.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{templateLabel(message, labels)}</span>
                  <span className="text-sm text-muted">
                    {channelLabel(message, labels)} · <LocalDateTime iso={message.processedAt ?? message.occurredAt} locale={locale} />
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusBadge[message.status]}>{labels.status[message.status]}</span>
                  <button type="button" onClick={() => setOpenId(message.id)} className={buttonGhost}>
                    {labels.details}
                  </button>
                  {message.status === "Parked" && retryButton(message, buttonSecondary)}
                </div>
              </div>
              {message.status !== "Sent" && message.lastError && (
                <p className="text-sm text-muted">
                  <bdi>{message.lastError}</bdi>
                </p>
              )}
              {error?.id === message.id && openId === null && (
                <p role="alert" className="text-sm text-accent">
                  {error.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <AdminDialog
        open={open !== null}
        onClose={() => setOpenId(null)}
        title={labels.detailsTitle}
        description={open ? templateLabel(open, labels) : undefined}
        closeLabel={closeLabel}
        busy={busy && retryingId !== null}
        footer={
          open?.status === "Parked" ? (
            <>
              {error?.id === open.id && (
                <p role="alert" className="me-auto text-sm text-accent">
                  {error.message}
                </p>
              )}
              {retryButton(open, buttonPrimary)}
            </>
          ) : undefined
        }
      >
        {open && (
          <div className="flex flex-col gap-4">
            {open.status === "Parked" && (
              <p className={notice}>
                <AlertIcon />
                {labels.parkedHint}
              </p>
            )}
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2.5 text-sm">
              <dt className="text-muted">{labels.channelLabel}</dt>
              <dd>{channelLabel(open, labels)}</dd>
              <dt className="text-muted">{labels.statusLabel}</dt>
              <dd>
                <span className={statusBadge[open.status]}>{labels.status[open.status]}</span>
              </dd>
              <dt className="text-muted">{labels.attempts}</dt>
              <dd className="tabular-nums">{open.attempts}</dd>
              <dt className="text-muted">{labels.queuedAt}</dt>
              <dd>
                <LocalDateTime iso={open.occurredAt} locale={locale} />
              </dd>
              {open.lastAttemptAt && (
                <>
                  <dt className="text-muted">{labels.lastAttemptAt}</dt>
                  <dd>
                    <LocalDateTime iso={open.lastAttemptAt} locale={locale} />
                  </dd>
                </>
              )}
              {open.status === "Pending" && (
                <>
                  <dt className="text-muted">{labels.nextAttemptAt}</dt>
                  <dd>
                    <LocalDateTime iso={open.nextAttemptAt} locale={locale} />
                  </dd>
                </>
              )}
              {open.processedAt && open.status === "Sent" && (
                <>
                  <dt className="text-muted">{labels.sentAt}</dt>
                  <dd>
                    <LocalDateTime iso={open.processedAt} locale={locale} />
                  </dd>
                </>
              )}
              {open.lastError && (
                <>
                  <dt className="text-muted">{labels.lastError}</dt>
                  <dd className="break-words">
                    <bdi>{open.lastError}</bdi>
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}
      </AdminDialog>
    </AdminSection>
  );
}
