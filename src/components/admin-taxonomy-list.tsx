"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { plural, t } from "@/lib/format";
import { Switch } from "./admin-form-controls";
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from "./icons";
import { badgeMuted } from "./ui";

export interface TaxonomyItem {
  id: string;
  isActive: boolean;
  productCount: number;
}

interface Props<T extends TaxonomyItem> {
  locale: Locale;
  items: T[];
  busy: boolean;
  /** Plain name for button labels ("Move Apple up"). */
  nameOf: (item: T) => string;
  /** Row content: the visible name (may add the other language) and a quiet second line. */
  title: (item: T) => ReactNode;
  subtitle: (item: T) => ReactNode;
  leading: (item: T) => ReactNode;
  /** Where the product count links to, e.g. the products list filtered by this brand. */
  countHref?: (item: T) => string;
  /** Move the row at `from` to `to`; the parent updates its list (the list keeps focus on the moved row). */
  onReorder: (from: number, to: number) => void;
  onToggle: (item: T, isActive: boolean) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  labels: Dictionary["admin"]["taxonomy"];
}

const rowButton =
  "inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 aria-disabled:cursor-progress pointer-coarse:size-10 [&_svg]:size-4";

/**
 * An ordered list of brands or categories: the order is the store's order, so rows move with arrow buttons;
 * each row can be shown or hidden, edited, and deleted while no product uses it.
 */
export function AdminTaxonomyList<T extends TaxonomyItem>({
  locale,
  items,
  busy,
  nameOf,
  title,
  subtitle,
  leading,
  countHref,
  onReorder,
  onToggle,
  onEdit,
  onDelete,
  labels,
}: Props<T>) {
  const listRef = useRef<HTMLOListElement>(null);

  const move = (from: number, to: number, direction: "up" | "down") => {
    // Busy arrows ignore clicks rather than going `disabled`, which would throw keyboard focus off the row.
    if (busy) return;
    const id = items[from].id;
    flushSync(() => onReorder(from, to));
    // Keep focus on the same arrow of the moved row, or its other arrow once it reaches an end.
    const row = listRef.current?.querySelector<HTMLElement>(`[data-row="${id}"]`);
    const same = row?.querySelector<HTMLButtonElement>(`[data-move="${direction}"]`);
    (same && !same.disabled ? same : row?.querySelector<HTMLButtonElement>(`[data-move="${direction === "up" ? "down" : "up"}"]`))?.focus();
  };

  return (
    <ol ref={listRef} className="flex flex-col divide-y divide-border">
      {items.map((item, index) => {
        const name = nameOf(item);
        const count = item.productCount === 0 ? labels.noProducts : plural(labels.productCount, item.productCount, locale);
        return (
          <li key={item.id} data-row={item.id} className={`flex items-center gap-3 px-3 py-3 transition-colors sm:gap-4 sm:px-4 ${item.isActive ? "" : "bg-background/60"}`}>
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                data-move="up"
                onClick={() => move(index, index - 1, "up")}
                disabled={index === 0}
                aria-disabled={busy || undefined}
                aria-label={t(labels.moveUp, { name })}
                className={`${rowButton} size-7 pointer-coarse:size-9`}
              >
                <ChevronUpIcon />
              </button>
              <button
                type="button"
                data-move="down"
                onClick={() => move(index, index + 1, "down")}
                disabled={index === items.length - 1}
                aria-disabled={busy || undefined}
                aria-label={t(labels.moveDown, { name })}
                className={`${rowButton} size-7 pointer-coarse:size-9`}
              >
                <ChevronDownIcon />
              </button>
            </div>

            <div className={item.isActive ? "" : "opacity-60"}>{leading(item)}</div>

            <div className={`flex min-w-0 flex-1 flex-col gap-0.5 ${item.isActive ? "" : "opacity-70"}`}>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{title(item)}</span>
                {!item.isActive && <span className={badgeMuted}>{labels.hidden}</span>}
              </span>
              <span className="truncate text-xs text-muted">{subtitle(item)}</span>
              <span className="text-xs text-muted sm:hidden">{count}</span>
            </div>

            <span className="hidden w-28 shrink-0 text-sm sm:block">
              {countHref && item.productCount > 0 ? (
                <Link href={countHref(item)} className="text-brand underline-offset-4 hover:underline">
                  {count}
                </Link>
              ) : (
                <span className="text-muted">{count}</span>
              )}
            </span>

            <Switch checked={item.isActive} onChange={(checked) => onToggle(item, checked)} ariaLabel={t(labels.show, { name })} disabled={busy} />

            <div className="flex shrink-0 items-center">
              <button type="button" onClick={() => onEdit(item)} aria-label={t(labels.edit, { name })} className={rowButton}>
                <PencilIcon />
              </button>
              {/* Only unused rows can go; the rest are hidden instead, which keeps their products' history intact. */}
              {item.productCount === 0 ? (
                <button type="button" onClick={() => onDelete(item)} disabled={busy} aria-label={t(labels.delete, { name })} className={`${rowButton} hover:text-accent`}>
                  <TrashIcon />
                </button>
              ) : (
                <span aria-hidden className="size-9 pointer-coarse:size-10" />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
