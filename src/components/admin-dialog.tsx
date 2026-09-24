"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";
import { iconButton } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  closeLabel: string;
  /** The body; scrolls when it is taller than the screen. A confirmation may need only the description. */
  children?: ReactNode;
  /** Actions pinned under the body (Save, Cancel). */
  footer?: ReactNode;
  size?: "md" | "lg";
  /** While true, Escape and the backdrop don't close it (a save is in flight). */
  busy?: boolean;
}

/**
 * A modal on the native <dialog>: focus is trapped and returned by the browser, Escape closes it, and the page
 * behind stops scrolling (globals.css). A centred card on larger screens and a bottom sheet on phones.
 * Mark the control to start in with data-autofocus.
 */
export function AdminDialog({ open, onClose, title, description, closeLabel, children, footer, size = "md", busy = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal focuses the first focusable element (the close button); a form can name a better start.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        // A click on the ::backdrop lands on the dialog element itself; clicks inside land on its children.
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      className={`m-auto flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col overflow-hidden rounded-panel border border-border bg-surface p-0 text-foreground shadow-float backdrop:bg-foreground/35 not-open:hidden motion-safe:open:animate-dialog-in max-sm:mb-0 max-sm:max-h-[calc(100dvh-1rem)] max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none ${
        size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
      }`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1 pt-1">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label={closeLabel} className={iconButton}>
          <CloseIcon />
        </button>
      </header>
      {/* Mounted only while open, so each opening starts from a fresh form. */}
      {open && (
        <>
          {children && <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>}
          {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/60 px-5 py-4 sm:px-6">{footer}</footer>}
        </>
      )}
    </dialog>
  );
}
