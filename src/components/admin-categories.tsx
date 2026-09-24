"use client";

import { useId, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminCategory, LocalizedText, ProductType } from "@/lib/api/types";
import { apiFieldErrors, catalogErrorMessage, errorCode, isValidSlug, localized, productLimits, productTypes, slugify } from "@/lib/admin-products";
import { t } from "@/lib/format";
import { useAdminAction } from "@/lib/use-admin-action";
import { AdminDialog } from "./admin-dialog";
import { AdornedInput, BilingualField, Field, Switch } from "./admin-form-controls";
import { AdminTaxonomyList } from "./admin-taxonomy-list";
import { AlertIcon, HeadphonesIcon, PhoneIcon, PlusIcon } from "./icons";
import { buttonGhost, buttonPrimary, buttonSecondary, notice, pageTitle, panel, panelTitle } from "./ui";

const categoryNameMax = 100;

interface Props {
  locale: Locale;
  categories: AdminCategory[];
  labels: Dictionary["admin"]["categories"];
  listLabels: Dictionary["admin"]["taxonomy"];
  languages: Dictionary["admin"]["languages"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

type Dialog = { kind: "new"; type: ProductType } | { kind: "edit"; category: AdminCategory } | { kind: "delete"; category: AdminCategory };

const toRequest = (c: AdminCategory) => ({ name: c.name, slug: c.slug, productType: c.productType, sortOrder: c.sortOrder, isActive: c.isActive });

/** Categories per product type (phones, accessories), each ordered as the store shows them. */
export function AdminCategories({ locale, categories, labels, listLabels, languages, errorLabels, closeLabel }: Props) {
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });
  const [saved, setSaved] = useState(categories);
  const [order, setOrder] = useState(categories);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (categories !== saved) {
    setSaved(categories);
    setOrder(categories);
  }

  const fail = (reason: unknown) => {
    setOrder(saved);
    setError(catalogErrorMessage(reason, errorLabels));
  };

  const reorder = (type: ProductType, from: number, to: number) => {
    const group = order.filter((c) => c.productType === type);
    group.splice(to, 0, group.splice(from, 1)[0]);
    setOrder([...order.filter((c) => c.productType !== type), ...group]);
    setError(null);
    void run(() => adminApi.reorderCategories(locale, group.map((c) => c.id))).then((result) => {
      if (!result.ok) fail(result.error);
    });
  };

  const toggle = async (category: AdminCategory, isActive: boolean) => {
    setError(null);
    setOrder((current) => current.map((c) => (c.id === category.id ? { ...c, isActive } : c)));
    const result = await run(() => adminApi.saveCategory(locale, category.id, { ...toRequest(category), isActive }));
    if (!result.ok) fail(result.error);
  };

  const remove = async (category: AdminCategory) => {
    setError(null);
    const result = await run(() => adminApi.deleteCategory(locale, category.id));
    setDialog(null);
    if (!result.ok) setError(catalogErrorMessage(result.error, errorLabels));
  };

  const other: Locale = locale === "ar" ? "en" : "ar";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex max-w-xl flex-col gap-2">
        <h1 className={pageTitle}>{labels.title}</h1>
        <p className="text-sm leading-relaxed text-muted">{labels.subtitle}</p>
      </header>

      {error && (
        <p role="alert" className={notice}>
          <AlertIcon />
          {error}
        </p>
      )}

      {productTypes.map((type) => {
        const group = order.filter((c) => c.productType === type);
        const phone = type === "Phone";
        const headingId = `categories-${type}`;
        return (
          <section key={type} aria-labelledby={headingId} className={`${panel} overflow-hidden`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-xl bg-brand/5 text-brand">
                  {phone ? <PhoneIcon className="size-[1.125rem]" /> : <HeadphonesIcon className="size-[1.125rem]" />}
                </span>
                <h2 id={headingId} className={panelTitle}>
                  {phone ? labels.groupPhones : labels.groupAccessories}
                </h2>
              </div>
              <button type="button" onClick={() => setDialog({ kind: "new", type })} className={buttonSecondary}>
                <PlusIcon />
                {labels.add}
              </button>
            </header>
            {group.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">{labels.emptyGroup}</p>
            ) : (
              <AdminTaxonomyList
                locale={locale}
                items={group}
                busy={busy}
                nameOf={(c) => localized(c.name, locale)}
                title={(c) => (
                  <>
                    {localized(c.name, locale)}
                    <span lang={other} className="ms-2 text-sm font-normal text-muted">
                      {c.name[other]}
                    </span>
                  </>
                )}
                subtitle={(c) => <bdi dir="ltr">?category={c.slug}</bdi>}
                leading={(c) => (
                  <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-brand">
                    {localized(c.name, locale).slice(0, 1)}
                  </span>
                )}
                onReorder={(from, to) => reorder(type, from, to)}
                onToggle={(c, isActive) => void toggle(c, isActive)}
                onEdit={(category) => setDialog({ kind: "edit", category })}
                onDelete={(category) => setDialog({ kind: "delete", category })}
                labels={listLabels}
              />
            )}
          </section>
        );
      })}

      {(dialog?.kind === "new" || dialog?.kind === "edit") && (
        <CategoryDialog
          locale={locale}
          category={dialog.kind === "edit" ? dialog.category : undefined}
          productType={dialog.kind === "edit" ? dialog.category.productType : dialog.type}
          nextSortOrder={
            Math.max(0, ...order.filter((c) => c.productType === (dialog.kind === "edit" ? dialog.category.productType : dialog.type)).map((c) => c.sortOrder)) + 1
          }
          onClose={() => setDialog(null)}
          labels={labels}
          languages={languages}
          errorLabels={errorLabels}
          closeLabel={closeLabel}
        />
      )}

      <AdminDialog
        open={dialog?.kind === "delete"}
        onClose={() => setDialog(null)}
        busy={busy}
        title={dialog?.kind === "delete" ? t(labels.deleteTitle, { name: localized(dialog.category.name, locale) }) : ""}
        description={labels.deleteBody}
        closeLabel={closeLabel}
        footer={
          <>
            <button type="button" onClick={() => setDialog(null)} disabled={busy} className={buttonGhost}>
              {labels.cancel}
            </button>
            <button type="button" onClick={() => dialog?.kind === "delete" && void remove(dialog.category)} disabled={busy} className={`${buttonPrimary} h-11 px-6`}>
              {busy ? labels.deleting : labels.deleteConfirm}
            </button>
          </>
        }
      />
    </div>
  );
}

interface DialogProps {
  locale: Locale;
  category?: AdminCategory;
  productType: ProductType;
  nextSortOrder: number;
  onClose: () => void;
  labels: Dictionary["admin"]["categories"];
  languages: Dictionary["admin"]["languages"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

type FieldKey = "en" | "ar" | "slug";

function CategoryDialog({ locale, category, productType, nextSortOrder, onClose, labels, languages, errorLabels, closeLabel }: DialogProps) {
  const formId = useId();
  const [name, setName] = useState<LocalizedText>(category?.name ?? { en: "", ar: "" });
  const [slug, setSlug] = useState<string | null>(category?.slug ?? null);
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });

  const effectiveSlug = slug ?? slugify(name.en);
  const phone = productType === "Phone";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const found: Partial<Record<FieldKey, string>> = {};
    for (const language of ["en", "ar"] as const) {
      const value = name[language].trim();
      if (!value) found[language] = labels.fieldErrors.required;
      else if (value.length > categoryNameMax) found[language] = t(labels.fieldErrors.tooLong, { max: categoryNameMax });
    }
    if (!effectiveSlug || !isValidSlug(effectiveSlug)) found.slug = labels.fieldErrors.slug;
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    const result = await run(() =>
      adminApi.saveCategory(locale, category?.id ?? null, {
        name: { en: name.en.trim(), ar: name.ar.trim() },
        slug: effectiveSlug,
        productType,
        sortOrder: category?.sortOrder ?? nextSortOrder,
        isActive,
      }),
    );
    if (result.ok) return onClose();

    const code = errorCode(result.error);
    if (code === "catalog.slug_taken" || code === "catalog.slug_required") return setErrors({ slug: catalogErrorMessage(result.error, errorLabels) });
    const fields = apiFieldErrors(result.error);
    if (fields && Object.keys(fields).some((key) => key.startsWith("name") || key === "slug")) {
      return setErrors({
        en: "name.en" in fields ? labels.fieldErrors.required : undefined,
        ar: "name.ar" in fields ? labels.fieldErrors.required : undefined,
        slug: "slug" in fields ? labels.fieldErrors.slug : undefined,
      });
    }
    setFormError(catalogErrorMessage(result.error, errorLabels));
  };

  return (
    <AdminDialog
      open
      onClose={onClose}
      busy={busy}
      title={category ? labels.editTitle : phone ? labels.newPhoneTitle : labels.newAccessoryTitle}
      closeLabel={closeLabel}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={buttonGhost}>
            {labels.cancel}
          </button>
          <button type="submit" form={formId} disabled={busy} className={`${buttonPrimary} h-11 px-6`}>
            {busy ? labels.saving : category ? labels.save : labels.create}
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
        <BilingualField
          label={labels.name}
          value={name}
          languages={languages}
          disabled={busy}
          errors={{ en: errors.en, ar: errors.ar }}
          onChange={(next) => {
            setName(next);
            setErrors((current) => ({ ...current, en: undefined, ar: undefined, slug: slug === null ? undefined : current.slug }));
          }}
        />
        <Field label={labels.slug} hint={labels.slugHint} error={errors.slug}>
          {(control) => (
            <AdornedInput
              {...control}
              prefix={`/${locale}/products?category=`}
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
