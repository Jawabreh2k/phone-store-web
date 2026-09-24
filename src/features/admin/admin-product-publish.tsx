"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import { catalogErrorMessage } from "@/lib/admin-products";
import { useAdminAction } from "@/lib/use-admin-action";
import { CheckIcon, ExternalIcon } from "@/components/ui/icons";
import { badgeMuted, badgeSuccess, buttonPrimary, buttonSecondary, fieldHint, panel, textLink } from "@/components/ui/ui";

export interface PublishCheck {
  id: string;
  label: string;
  done: boolean;
  /** Required checks block publishing; the others are advice. */
  required: boolean;
  /** The editor section that fixes it. */
  anchor: string;
}

interface Props {
  locale: Locale;
  productId: string;
  isPublished: boolean;
  storeHref: string;
  checks: PublishCheck[];
  /** "3 options · 42 units". */
  summary: string;
  labels: Dictionary["admin"]["productEditor"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
}

/** Whether customers can see the product, what it still needs, and the switch to put it live. */
export function AdminProductPublish({ locale, productId, isPublished, storeHref, checks, summary, labels, errorLabels }: Props) {
  const [error, setError] = useState<string | null>(null);
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });
  const blocked = checks.some((check) => check.required && !check.done);
  const doneCount = checks.filter((check) => check.done).length;

  const toggle = async () => {
    setError(null);
    const result = await run(() => adminApi.setProductPublished(locale, productId, !isPublished));
    if (!result.ok) setError(catalogErrorMessage(result.error, errorLabels));
  };

  return (
    <section aria-labelledby="publish-title" className={`${panel} flex flex-col gap-5 p-5 sm:p-6`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 id="publish-title" className="text-base font-semibold tracking-tight">
            {labels.visibility}
          </h2>
          <span className={isPublished ? badgeSuccess : badgeMuted}>{isPublished ? labels.published : labels.draft}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted">{isPublished ? labels.publishedBody : labels.draftBody}</p>
        <p className="text-xs font-medium text-muted tabular-nums">{summary}</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">{labels.checklist}</h3>
          <span className="text-xs text-muted tabular-nums">
            {doneCount}/{checks.length}
          </span>
        </div>
        <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-foreground/5">
          <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${(doneCount / checks.length) * 100}%` }} />
        </div>
        <ul className="flex flex-col gap-1">
          {checks.map((check) => (
            <li key={check.id}>
              <a href={`#${check.anchor}`} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 text-sm transition-colors hover:bg-foreground/[0.03]">
                <span
                  aria-hidden
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
                    check.done ? "bg-success text-brand-foreground" : "border-[1.5px] border-dashed border-foreground/30"
                  }`}
                >
                  {check.done && <CheckIcon className="size-3" />}
                </span>
                <span className={`flex-1 ${check.done ? "text-muted" : "font-medium"}`}>
                  {check.label}
                  <span className="sr-only">: {check.done ? labels.done : labels.todo}</span>
                </span>
                {!check.done && <span className={`text-xs ${check.required ? "font-medium text-accent" : "text-muted"}`}>{check.required ? labels.required : labels.recommended}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border pt-5">
        {isPublished ? (
          <button type="button" onClick={toggle} disabled={busy} className={`${buttonSecondary} w-full`}>
            {busy ? labels.updating : labels.unpublish}
          </button>
        ) : (
          <button type="button" onClick={toggle} disabled={busy || blocked} aria-describedby={blocked ? "publish-blocked" : undefined} className={`${buttonPrimary} w-full`}>
            {busy ? labels.updating : labels.publish}
          </button>
        )}
        {blocked && !isPublished && (
          <p id="publish-blocked" className="text-center text-xs text-muted">
            {labels.publishBlocked}
          </p>
        )}
        {error && (
          <p role="alert" className={`${fieldHint} text-center`}>
            {error}
          </p>
        )}
        {isPublished && (
          <a href={storeHref} target="_blank" rel="noopener" className={`${textLink} inline-flex items-center justify-center gap-1.5 self-center`}>
            {labels.viewInStore}
            <ExternalIcon className="size-3.5" />
          </a>
        )}
      </div>
    </section>
  );
}
