"use client";

import { useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminSpecification, LocalizedText } from "@/lib/api/types";
import { catalogErrorMessage, productLimits } from "@/lib/admin-products";
import { t } from "@/lib/format";
import { useAdminAction, useUnsavedChangesWarning } from "@/lib/use-admin-action";
import { LangInput } from "@/features/admin/admin-form-controls";
import { AdminSection, SaveBar } from "@/features/admin/admin-section";
import { ChevronDownIcon, ChevronUpIcon, ListIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { buttonSecondary, emptyArea } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  productId: string;
  specifications: AdminSpecification[];
  labels: Dictionary["admin"]["specs"];
  saveBarLabels: Dictionary["admin"]["saveBar"];
  languages: Dictionary["admin"]["languages"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
}

interface Row extends AdminSpecification {
  /** Stable React key; rows move and get removed, so the index won't do. */
  key: number;
}

// Keys only need to be unique within the list, so they come from the rows themselves (no shared counter).
const withKeys = (specs: AdminSpecification[]): Row[] => specs.map((spec, index) => ({ ...spec, key: index + 1 }));
const nextKey = (rows: Row[]) => rows.reduce((max, row) => Math.max(max, row.key), 0) + 1;

const blank = (): LocalizedText => ({ en: "", ar: "" });
const trimmed = (text: LocalizedText): LocalizedText => ({ en: text.en.trim(), ar: text.ar.trim() });
const isBlank = (row: AdminSpecification) => !row.label.en.trim() && !row.label.ar.trim() && !row.value.en.trim() && !row.value.ar.trim();
const isComplete = (row: AdminSpecification) => Boolean(row.label.en.trim() && row.label.ar.trim() && row.value.en.trim() && row.value.ar.trim());

/** What would be saved: blank rows dropped, text trimmed. */
const toPayload = (rows: AdminSpecification[]): AdminSpecification[] =>
  rows.filter((row) => !isBlank(row)).map((row) => ({ label: trimmed(row.label), value: trimmed(row.value) }));

const tooLong = (row: AdminSpecification) =>
  Math.max(row.label.en.length, row.label.ar.length) > productLimits.specLabelMax || Math.max(row.value.en.length, row.value.ar.length) > productLimits.specValueMax;

/** The specification table (label → value, in both languages), edited as a whole and saved in one go. */
export function AdminProductSpecs({ locale, productId, specifications, labels, saveBarLabels, languages, errorLabels }: Props) {
  const [baseline, setBaseline] = useState(() => toPayload(specifications));
  const [rows, setRows] = useState<Row[]>(() => withKeys(specifications));
  const [invalid, setInvalid] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const { run, busy, saved } = useAdminAction(locale, { storefront: "catalog" });

  const dirty = JSON.stringify(toPayload(rows)) !== JSON.stringify(baseline);
  useUnsavedChangesWarning(dirty);

  const edit = (key: number, part: "label" | "value", text: LocalizedText) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [part]: text } : row)));
    if (invalid.has(key)) setInvalid((current) => new Set([...current].filter((k) => k !== key)));
  };

  const add = () => {
    const key = nextKey(rows);
    // Commit the row now, then put the cursor in its first field, ready to type.
    flushSync(() => setRows((current) => [...current, { key, label: blank(), value: blank() }]));
    listRef.current?.querySelector<HTMLInputElement>(`[data-row="${key}"] input`)?.focus();
  };

  const move = (index: number, delta: number) =>
    setRows((current) => {
      const next = [...current];
      next.splice(index + delta, 0, next.splice(index, 1)[0]);
      return next;
    });

  const remove = (key: number) => setRows((current) => current.filter((row) => row.key !== key));

  const discard = () => {
    setRows(withKeys(baseline));
    setInvalid(new Set());
    setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const bad = new Set(rows.filter((row) => !isBlank(row) && (!isComplete(row) || tooLong(row))).map((row) => row.key));
    if (bad.size > 0) {
      flushSync(() => {
        setInvalid(bad);
        setError(labels.incomplete);
      });
      listRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setInvalid(bad);

    const payload = toPayload(rows);
    setError(null);
    const result = await run(() => adminApi.replaceSpecifications(locale, productId, payload));
    if (result.ok) {
      setBaseline(payload);
      setRows((current) => current.filter((row) => !isBlank(row)));
    } else {
      setError(catalogErrorMessage(result.error, errorLabels));
    }
  };

  const full = rows.length >= productLimits.maxSpecifications;

  return (
    <form noValidate onSubmit={submit}>
      <AdminSection
        id="specifications"
        title={labels.title}
        description={labels.description}
        icon={<ListIcon />}
        action={
          rows.length > 0 && (
            <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium tabular-nums text-muted">
              {rows.length}/{productLimits.maxSpecifications}
            </span>
          )
        }
        footer={<SaveBar dirty={dirty} busy={busy} saved={saved} error={error} onDiscard={discard} labels={saveBarLabels} />}
      >
        {rows.length === 0 ? (
          <div className={emptyArea}>
            <span aria-hidden className="inline-flex size-14 items-center justify-center rounded-full bg-brand/5 text-brand">
              <ListIcon className="size-6" />
            </span>
            <p className="font-semibold">{labels.emptyTitle}</p>
            <p className="max-w-sm text-sm leading-relaxed text-muted">{labels.emptyBody}</p>
            <button type="button" onClick={add} className={`${buttonSecondary} mt-2`}>
              <PlusIcon />
              {labels.add}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div aria-hidden className="hidden grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1.4fr)_5.5rem] gap-3 px-3 text-xs font-medium text-muted md:grid">
              <span />
              <span>{labels.label}</span>
              <span>{labels.value}</span>
              <span />
            </div>
            <ol ref={listRef} className="flex flex-col gap-2.5">
              {rows.map((row, index) => {
                const n = index + 1;
                const bad = invalid.has(row.key);
                const input = (part: "label" | "value", language: Locale, placeholder: string) => (
                  <LangInput
                    compact
                    language={language}
                    value={row[part][language]}
                    onChange={(text) => edit(row.key, part, { ...row[part], [language]: text })}
                    label={`${part === "label" ? labels.label : labels.value} ${n}, ${language === "en" ? languages.english : languages.arabic}`}
                    invalid={bad && (!row[part][language].trim() || row[part][language].length > (part === "label" ? productLimits.specLabelMax : productLimits.specValueMax))}
                    disabled={busy}
                    placeholder={placeholder}
                  />
                );
                return (
                  <li
                    key={row.key}
                    data-row={row.key}
                    className={`grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 rounded-2xl border p-3 transition-colors md:grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1.4fr)_5.5rem] md:items-start ${
                      bad ? "border-accent/40 bg-accent/[0.03]" : "border-border bg-background/50"
                    }`}
                  >
                    <span aria-hidden className="mt-2 inline-flex size-7 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted tabular-nums ring-1 ring-border">
                      {n}
                    </span>
                    <div className="flex flex-col gap-2">
                      {input("label", "en", index === 0 ? labels.labelExampleEn : "")}
                      {input("label", "ar", index === 0 ? labels.labelExampleAr : "")}
                    </div>
                    <div className="col-start-2 flex flex-col gap-2 md:col-start-auto">
                      {input("value", "en", index === 0 ? labels.valueExampleEn : "")}
                      {input("value", "ar", index === 0 ? labels.valueExampleAr : "")}
                    </div>
                    <div className="col-start-2 flex items-center gap-1 md:col-start-auto md:mt-1 md:flex-col md:items-end">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={t(labels.moveUp, { n })} className={rowButton}>
                          <ChevronUpIcon />
                        </button>
                        <button type="button" onClick={() => move(index, 1)} disabled={busy || index === rows.length - 1} aria-label={t(labels.moveDown, { n })} className={rowButton}>
                          <ChevronDownIcon />
                        </button>
                      </div>
                      <button type="button" onClick={() => remove(row.key)} disabled={busy} aria-label={t(labels.remove, { n })} className={`${rowButton} ms-auto hover:text-accent md:ms-0`}>
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={add} disabled={busy || full} className={`${buttonSecondary} w-fit`}>
              <PlusIcon />
              {labels.add}
            </button>
          </div>
        )}
      </AdminSection>
    </form>
  );
}

const rowButton =
  "inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent pointer-coarse:size-10 [&_svg]:size-4";
