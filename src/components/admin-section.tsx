import type { ReactNode } from "react";
import { CheckIcon } from "./icons";
import { buttonGhost, buttonPrimary, panel, panelTitle } from "./ui";

interface SectionProps {
  /** Anchor for the editor's section links. */
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Header action, e.g. "Add option". */
  action?: ReactNode;
  children: ReactNode;
  /** A SaveBar, when the section is a form. */
  footer?: ReactNode;
}

/** One card of the product editor. Each card saves on its own, because each maps to one API call. */
export function AdminSection({ id, title, description, icon, action, children, footer }: SectionProps) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className={`${panel} scroll-mt-6`}>
      <header className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-6">
        <div className="flex min-w-0 items-start gap-3.5">
          {icon && (
            <span aria-hidden className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/5 text-brand [&_svg]:size-[1.125rem]">
              {icon}
            </span>
          )}
          <div className="flex max-w-xl flex-col gap-1">
            <h2 id={headingId} className={panelTitle}>
              {title}
            </h2>
            {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
      {footer}
    </section>
  );
}

export interface SaveBarLabels {
  save: string;
  saving: string;
  saved: string;
  discard: string;
  unsaved: string;
}

interface SaveBarProps {
  dirty: boolean;
  busy: boolean;
  saved: boolean;
  error?: string | null;
  onDiscard: () => void;
  labels: SaveBarLabels;
}

/**
 * The save row under a section form. It appears only with something to say (edits, saving, saved, an error);
 * while there are unsaved edits it floats at the bottom of the screen, so Save stays in reach however long the
 * section is. The submit button belongs to the enclosing <form>, so Enter in a field saves too.
 */
export function SaveBar({ dirty, busy, saved, error, onDiscard, labels }: SaveBarProps) {
  const floating = dirty || busy;
  if (!floating && !saved && !error) return null;
  return (
    <div
      className={`z-10 mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-[background-color,border-color,box-shadow] duration-200 sm:mx-4 sm:mb-4 ${
        floating ? "sticky bottom-3 border-brand/15 bg-surface shadow-float" : "border-transparent bg-transparent"
      }`}
    >
      <p aria-live="polite" className="flex min-h-5 items-center gap-2 text-sm">
        {error ? (
          <span role="alert" className="text-accent">
            {error}
          </span>
        ) : dirty ? (
          <>
            <span aria-hidden className="size-2 rounded-full bg-accent" />
            <span className="font-medium">{labels.unsaved}</span>
          </>
        ) : saved ? (
          <span className="flex items-center gap-1.5 font-medium text-success">
            <CheckIcon className="size-4" />
            {labels.saved}
          </span>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        {dirty && (
          <button type="button" onClick={onDiscard} disabled={busy} className={buttonGhost}>
            {labels.discard}
          </button>
        )}
        <button type="submit" disabled={!dirty || busy} className={`${buttonPrimary} h-11 px-6`}>
          {busy ? labels.saving : labels.save}
        </button>
      </div>
    </div>
  );
}
