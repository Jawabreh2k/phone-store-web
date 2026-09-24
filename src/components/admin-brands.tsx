"use client";

import Image from "next/image";
import { useId, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminBrand } from "@/lib/api/types";
import { apiFieldErrors, catalogErrorMessage, errorCode, isValidSlug, productLimits, slugify } from "@/lib/admin-products";
import { t } from "@/lib/format";
import { useAdminAction } from "@/lib/use-admin-action";
import { AdminDialog } from "./admin-dialog";
import { AdornedInput, Field, Switch } from "./admin-form-controls";
import { AdminTaxonomyList } from "./admin-taxonomy-list";
import { AlertIcon, PlusIcon, TagIcon } from "./icons";
import { buttonGhost, buttonPrimary, emptyArea, fieldInput, notice, pageTitle, panel } from "./ui";

const brandNameMax = 80;

interface Props {
  locale: Locale;
  brands: AdminBrand[];
  labels: Dictionary["admin"]["brands"];
  listLabels: Dictionary["admin"]["taxonomy"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

type Dialog = { kind: "new" } | { kind: "edit"; brand: AdminBrand } | { kind: "delete"; brand: AdminBrand };

/** The brand list: order (as in the store's filters), visibility, and add / rename / delete. */
export function AdminBrands({ locale, brands, labels, listLabels, errorLabels, closeLabel }: Props) {
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });
  const [saved, setSaved] = useState(brands);
  const [order, setOrder] = useState(brands);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fresh server data replaces the optimistic order.
  if (brands !== saved) {
    setSaved(brands);
    setOrder(brands);
  }

  const reorder = (from: number, to: number) => {
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
    setError(null);
    void run(() => adminApi.reorderBrands(locale, next.map((b) => b.id))).then((result) => {
      if (result.ok) return;
      setOrder(saved);
      setError(catalogErrorMessage(result.error, errorLabels));
    });
  };

  const toggle = async (brand: AdminBrand, isActive: boolean) => {
    setError(null);
    setOrder((current) => current.map((b) => (b.id === brand.id ? { ...b, isActive } : b)));
    const result = await run(() => adminApi.saveBrand(locale, brand.id, { ...toRequest(brand), isActive }));
    if (!result.ok) {
      setOrder(saved);
      setError(catalogErrorMessage(result.error, errorLabels));
    }
  };

  const remove = async (brand: AdminBrand) => {
    setError(null);
    const result = await run(() => adminApi.deleteBrand(locale, brand.id));
    setDialog(null);
    if (!result.ok) setError(catalogErrorMessage(result.error, errorLabels));
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className={pageTitle}>{labels.title}</h1>
          <p className="text-sm leading-relaxed text-muted">{labels.subtitle}</p>
        </div>
        <button type="button" onClick={() => setDialog({ kind: "new" })} className={buttonPrimary}>
          <PlusIcon />
          {labels.add}
        </button>
      </header>

      {error && (
        <p role="alert" className={notice}>
          <AlertIcon />
          {error}
        </p>
      )}

      {order.length === 0 ? (
        <div className={emptyArea}>
          <span aria-hidden className="inline-flex size-14 items-center justify-center rounded-full bg-brand/5 text-brand">
            <TagIcon className="size-6" />
          </span>
          <p className="font-semibold">{labels.emptyTitle}</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted">{labels.emptyBody}</p>
        </div>
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <AdminTaxonomyList
            locale={locale}
            items={order}
            busy={busy}
            nameOf={(b) => b.name}
            title={(b) => b.name}
            subtitle={(b) => <bdi dir="ltr">?brand={b.slug}</bdi>}
            leading={(b) => <BrandMark brand={b} />}
            countHref={(b) => `/${locale}/admin/products?brand=${b.id}`}
            onReorder={reorder}
            onToggle={(b, isActive) => void toggle(b, isActive)}
            onEdit={(brand) => setDialog({ kind: "edit", brand })}
            onDelete={(brand) => setDialog({ kind: "delete", brand })}
            labels={listLabels}
          />
        </div>
      )}

      {(dialog?.kind === "new" || dialog?.kind === "edit") && (
        <BrandDialog
          locale={locale}
          brand={dialog.kind === "edit" ? dialog.brand : undefined}
          nextSortOrder={Math.max(0, ...order.map((b) => b.sortOrder)) + 1}
          onClose={() => setDialog(null)}
          labels={labels}
          errorLabels={errorLabels}
          closeLabel={closeLabel}
        />
      )}

      <AdminDialog
        open={dialog?.kind === "delete"}
        onClose={() => setDialog(null)}
        busy={busy}
        title={dialog?.kind === "delete" ? t(labels.deleteTitle, { name: dialog.brand.name }) : ""}
        description={labels.deleteBody}
        closeLabel={closeLabel}
        footer={
          <>
            <button type="button" onClick={() => setDialog(null)} disabled={busy} className={buttonGhost}>
              {labels.cancel}
            </button>
            <button type="button" onClick={() => dialog?.kind === "delete" && void remove(dialog.brand)} disabled={busy} className={`${buttonPrimary} h-11 px-6`}>
              {busy ? labels.deleting : labels.deleteConfirm}
            </button>
          </>
        }
      />
    </div>
  );
}

const toRequest = (brand: AdminBrand) => ({
  name: brand.name,
  slug: brand.slug,
  logoUrl: brand.logoUrl,
  sortOrder: brand.sortOrder,
  isActive: brand.isActive,
});

/** The brand's logo when it has one, else its initial on a quiet disc. */
function BrandMark({ brand }: { brand: AdminBrand }) {
  return (
    <span aria-hidden className="relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-sm font-semibold text-brand">
      {brand.logoUrl ? <Image src={brand.logoUrl} alt="" fill sizes="2.5rem" className="object-contain p-1.5" /> : brand.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

interface DialogProps {
  locale: Locale;
  brand?: AdminBrand;
  /** Where a new brand goes: the end of the list. */
  nextSortOrder: number;
  onClose: () => void;
  labels: Dictionary["admin"]["brands"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

type FieldKey = "name" | "slug";

function BrandDialog({ locale, brand, nextSortOrder, onClose, labels, errorLabels, closeLabel }: DialogProps) {
  const formId = useId();
  const [name, setName] = useState(brand?.name ?? "");
  // A new brand's link follows its name until staff type one; an existing link never changes by itself.
  const [slug, setSlug] = useState<string | null>(brand?.slug ?? null);
  const [isActive, setIsActive] = useState(brand?.isActive ?? true);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });

  const effectiveSlug = slug ?? slugify(name);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const found: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) found.name = labels.fieldErrors.required;
    else if (name.trim().length > brandNameMax) found.name = t(labels.fieldErrors.tooLong, { max: brandNameMax });
    if (!effectiveSlug || !isValidSlug(effectiveSlug)) found.slug = labels.fieldErrors.slug;
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    const result = await run(() =>
      adminApi.saveBrand(locale, brand?.id ?? null, {
        name: name.trim(),
        slug: effectiveSlug,
        logoUrl: brand?.logoUrl ?? null,
        sortOrder: brand?.sortOrder ?? nextSortOrder,
        isActive,
      }),
    );
    if (result.ok) return onClose();

    const code = errorCode(result.error);
    if (code === "catalog.slug_taken" || code === "catalog.slug_required") return setErrors({ slug: catalogErrorMessage(result.error, errorLabels) });
    const fields = apiFieldErrors(result.error);
    if (fields && ("name" in fields || "slug" in fields)) {
      return setErrors({ name: "name" in fields ? labels.fieldErrors.required : undefined, slug: "slug" in fields ? labels.fieldErrors.slug : undefined });
    }
    setFormError(catalogErrorMessage(result.error, errorLabels));
  };

  return (
    <AdminDialog
      open
      onClose={onClose}
      busy={busy}
      title={brand ? labels.editTitle : labels.newTitle}
      closeLabel={closeLabel}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={buttonGhost}>
            {labels.cancel}
          </button>
          <button type="submit" form={formId} disabled={busy} className={`${buttonPrimary} h-11 px-6`}>
            {busy ? labels.saving : brand ? labels.save : labels.create}
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-5">
        {formError && (
          <p role="alert" className={notice}>
            <AlertIcon />
            {formError}
          </p>
        )}
        <Field label={labels.name} hint={labels.nameHint} error={errors.name}>
          {(control) => (
            <input
              {...control}
              data-autofocus
              value={name}
              maxLength={brandNameMax + 20}
              disabled={busy}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined, slug: slug === null ? undefined : current.slug }));
              }}
              className={fieldInput}
            />
          )}
        </Field>
        <Field label={labels.slug} hint={labels.slugHint} error={errors.slug}>
          {(control) => (
            <AdornedInput
              {...control}
              prefix={`/${locale}/products?brand=`}
              value={effectiveSlug}
              maxLength={productLimits.slugMax}
              disabled={busy}
              onChange={(value) => {
                setSlug(value.toLowerCase());
                setErrors((current) => ({ ...current, slug: undefined }));
              }}
            />
          )}
        </Field>
        <div className="rounded-2xl border border-border bg-background/60 px-4 py-3.5">
          <Switch checked={isActive} onChange={setIsActive} label={labels.visible} description={labels.visibleHint} disabled={busy} />
        </div>
      </form>
    </AdminDialog>
  );
}
