"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminProductListItem } from "@/lib/api/types";
import { localized, catalogErrorMessage } from "@/lib/admin-products";
import { plural, t } from "@/lib/format";
import { useAdminAction, useUnsavedChangesWarning } from "@/lib/use-admin-action";
import { AdminSection, SaveBar } from "@/features/admin/admin-section";
import { CheckIcon, CloseIcon, LinkIcon, PhoneIcon, SearchIcon } from "@/components/ui/icons";
import { badgeMuted, chipRemovable, fieldInput } from "@/components/ui/ui";

interface Props {
  locale: Locale;
  productId: string;
  selectedIds: string[];
  phones: AdminProductListItem[];
  labels: Dictionary["admin"]["compatibility"];
  saveBarLabels: Dictionary["admin"]["saveBar"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
}

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((id) => b.has(id));

/** Which phones an accessory fits; it then shows on each of those phones' pages. */
export function AdminProductCompatibility({ locale, productId, selectedIds, phones, labels, saveBarLabels, errorLabels }: Props) {
  const [baseline, setBaseline] = useState(() => new Set(selectedIds));
  const [selected, setSelected] = useState(baseline);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { run, busy, saved } = useAdminAction(locale, { storefront: "catalog" });

  const dirty = !sameSet(selected, baseline);
  useUnsavedChangesWarning(dirty);

  const nameOf = (phone: AdminProductListItem) => localized(phone.name, locale);
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const term = query.trim().toLowerCase();
  const matches = term
    ? phones.filter((p) => [p.name.en, p.name.ar, p.brandName].some((text) => text.toLowerCase().includes(term)))
    : phones;
  // Grouped by brand, the way staff think about a phone range.
  const byBrand = new Map<string, AdminProductListItem[]>();
  for (const phone of matches) byBrand.set(phone.brandName, [...(byBrand.get(phone.brandName) ?? []), phone]);
  const chosen = phones.filter((p) => selected.has(p.id));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    const ids = [...selected];
    const result = await run(() => adminApi.setCompatiblePhones(locale, productId, ids));
    if (result.ok) setBaseline(new Set(ids));
    else setError(catalogErrorMessage(result.error, errorLabels));
  };

  return (
    <form noValidate onSubmit={submit}>
      <AdminSection
        id="compatibility"
        title={labels.title}
        description={labels.description}
        icon={<LinkIcon />}
        footer={
          <SaveBar
            dirty={dirty}
            busy={busy}
            saved={saved}
            error={error}
            onDiscard={() => {
              setSelected(baseline);
              setError(null);
            }}
            labels={saveBarLabels}
          />
        }
      >
        {phones.length === 0 ? (
          <p className="text-sm text-muted">{labels.noPhones}</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              <p aria-live="polite" className="text-sm font-medium">
                {chosen.length === 0 ? <span className="text-muted">{labels.none}</span> : plural(labels.selected, chosen.length, locale)}
              </p>
              {chosen.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {chosen.map((phone) => (
                    <li key={phone.id}>
                      <button type="button" onClick={() => toggle(phone.id)} disabled={busy} aria-label={t(labels.remove, { name: nameOf(phone) })} className={chipRemovable}>
                        {nameOf(phone)}
                        <CloseIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <label htmlFor={`${productId}-phone-search`} className="sr-only">
                {labels.search}
              </label>
              <SearchIcon className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                id={`${productId}-phone-search`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={labels.search}
                className={`${fieldInput} ps-11`}
              />
            </div>

            <div className="max-h-[26rem] overflow-y-auto rounded-2xl border border-border">
              {matches.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">{t(labels.noMatch, { query: query.trim() })}</p>
              ) : (
                [...byBrand].map(([brand, group]) => (
                  <fieldset key={brand} className="border-b border-border last:border-b-0">
                    <legend className="sticky top-0 z-[1] w-full bg-surface/95 px-4 pt-3 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">{brand}</legend>
                    <ul className="flex flex-col">
                      {group.map((phone) => (
                        <li key={phone.id}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-foreground/[0.03] has-checked:bg-brand/[0.04]">
                            <input type="checkbox" checked={selected.has(phone.id)} onChange={() => toggle(phone.id)} disabled={busy} className="peer sr-only" />
                            <span
                              aria-hidden
                              className="inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-foreground/25 bg-surface text-transparent transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
                            >
                              <CheckIcon className="size-3.5" />
                            </span>
                            <span aria-hidden className="relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-muted/50">
                              {phone.imageUrl ? <Image src={phone.imageUrl} alt="" fill sizes="2.5rem" className="object-contain p-0.5" /> : <PhoneIcon />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{nameOf(phone)}</span>
                            {!phone.isPublished && <span className={badgeMuted}>{labels.draft}</span>}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                ))
              )}
            </div>
          </div>
        )}
      </AdminSection>
    </form>
  );
}
