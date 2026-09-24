"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import type { AdminBrand, AdminCategory, AdminProduct, LocalizedText, ProductType, SaveProductRequest } from "@/lib/api/types";
import {
  apiFieldErrors,
  errorCode,
  isValidSlug,
  localized,
  catalogErrorMessage,
  productLimits,
  productTypes,
  slugify,
} from "@/lib/admin-products";
import { t } from "@/lib/format";
import { useAdminAction, useUnsavedChangesWarning } from "@/lib/use-admin-action";
import { AdornedInput, BilingualField, Field, SelectField, Switch } from "./admin-form-controls";
import { AdminSection, SaveBar } from "./admin-section";
import { AlertIcon, CheckIcon, HeadphonesIcon, PencilIcon, PhoneIcon } from "./icons";
import { buttonGhost, buttonPrimary, formSection, formSectionTitle, notice, panel } from "./ui";

interface Props {
  locale: Locale;
  brands: AdminBrand[];
  categories: AdminCategory[];
  /** The product being edited; absent on the "New product" page. */
  product?: AdminProduct;
  /** Where Cancel goes on the "New product" page. */
  cancelHref?: string;
  labels: Dictionary["admin"]["productForm"];
  saveBarLabels: Dictionary["admin"]["saveBar"];
  languages: Dictionary["admin"]["languages"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
}

interface Draft {
  type: ProductType;
  name: LocalizedText;
  /** What staff typed. Until they type, the link follows the English name. */
  slug: string;
  slugTouched: boolean;
  brandId: string;
  categoryId: string;
  description: LocalizedText;
  isFeatured: boolean;
}

type FieldKey = "name.en" | "name.ar" | "slug" | "brandId" | "categoryId" | "description.en" | "description.ar";
type FieldErrors = Partial<Record<FieldKey, string>>;

const fieldKeys = new Set<string>(["name.en", "name.ar", "slug", "brandId", "categoryId", "description.en", "description.ar"]);

/** Business-rule errors that belong to one field, so they show under it rather than above the form. */
const fieldForCode: Partial<Record<string, FieldKey>> = {
  "catalog.slug_taken": "slug",
  "catalog.slug_required": "slug",
  "catalog.brand_not_found": "brandId",
  "catalog.category_not_found": "categoryId",
  "catalog.category_type_mismatch": "categoryId",
};

function initialDraft(product: AdminProduct | undefined, categories: AdminCategory[]): Draft {
  if (product) {
    return {
      type: product.type,
      name: product.name,
      slug: product.slug,
      slugTouched: true,
      brandId: product.brandId,
      categoryId: product.categoryId,
      description: product.description,
      isFeatured: product.isFeatured,
    };
  }
  const phoneCategories = categories.filter((c) => c.productType === "Phone");
  return {
    type: "Phone",
    name: { en: "", ar: "" },
    slug: "",
    slugTouched: false,
    brandId: "",
    categoryId: phoneCategories.length === 1 ? phoneCategories[0].id : "",
    description: { en: "", ar: "" },
    isFeatured: false,
  };
}

const effectiveSlug = (draft: Draft) => (draft.slugTouched ? draft.slug.trim() : slugify(draft.name.en));

function toRequest(draft: Draft): SaveProductRequest {
  return {
    type: draft.type,
    brandId: draft.brandId,
    categoryId: draft.categoryId,
    name: { en: draft.name.en.trim(), ar: draft.name.ar.trim() },
    slug: effectiveSlug(draft) || null,
    description: { en: draft.description.en.trim(), ar: draft.description.ar.trim() },
    isFeatured: draft.isFeatured,
  };
}

function validate(draft: Draft, labels: Props["labels"]): FieldErrors {
  const errors: FieldErrors = {};
  const text = (key: FieldKey, value: string, max: number) => {
    if (!value.trim()) errors[key] = labels.fieldErrors.required;
    else if (value.trim().length > max) errors[key] = t(labels.fieldErrors.tooLong, { max });
  };

  text("name.en", draft.name.en, productLimits.nameMax);
  text("name.ar", draft.name.ar, productLimits.nameMax);

  const slug = effectiveSlug(draft);
  if (slug && !isValidSlug(slug)) errors.slug = labels.fieldErrors.slug;
  else if (!slug && draft.name.en.trim()) errors.slug = labels.fieldErrors.slugNeedsEnglish;

  if (!draft.brandId) errors.brandId = labels.fieldErrors.brand;
  if (!draft.categoryId) errors.categoryId = labels.fieldErrors.category;

  text("description.en", draft.description.en, productLimits.descriptionMax);
  text("description.ar", draft.description.ar, productLimits.descriptionMax);
  return errors;
}

/** The product's own fields. On "New product" it is the whole page; in the editor it is the Details card. */
export function AdminProductForm({ locale, brands, categories, product, cancelHref, labels, saveBarLabels, languages, errorLabels }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const creating = !product;
  const [baseline, setBaseline] = useState(() => initialDraft(product, categories));
  const [draft, setDraft] = useState(baseline);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { run, busy, saved } = useAdminAction(locale, { storefront: "catalog" });
  const [redirecting, startRedirect] = useTransition();

  const dirty = JSON.stringify(toRequest(draft)) !== JSON.stringify(toRequest(baseline));
  useUnsavedChangesWarning(dirty && !redirecting);
  const disabled = busy || redirecting;

  const update = (changes: Partial<Draft>, cleared: FieldKey[] = []) => {
    setDraft((current) => ({ ...current, ...changes }));
    if (cleared.some((key) => fieldErrors[key])) {
      const next = { ...fieldErrors };
      for (const key of cleared) delete next[key];
      setFieldErrors(next);
      // The "check the highlighted fields" banner goes once nothing is highlighted any more.
      if (Object.keys(next).length === 0) setFormError(null);
    }
  };

  const setType = (type: ProductType) => {
    const options = categories.filter((c) => c.productType === type);
    const keep = options.some((c) => c.id === draft.categoryId);
    update({ type, categoryId: keep ? draft.categoryId : options.length === 1 ? options[0].id : "" }, ["categoryId"]);
  };

  const showErrors = (errors: FieldErrors) => {
    flushSync(() => {
      setFieldErrors(errors);
      setFormError(labels.fixErrors);
    });
    // Fields render in reading order, so the first invalid control in the DOM is the first one staff see.
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    const errors = validate(draft, labels);
    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);

    const body = toRequest(draft);
    const result = await run(
      () => (product ? adminApi.updateProduct(locale, product.id, body) : adminApi.createProduct(locale, body)),
      { refresh: !creating },
    );

    if (result.ok) {
      if (creating) startRedirect(() => router.push(`/${locale}/admin/products/${result.value}?created=1`));
      else setBaseline(draft);
      return;
    }

    const serverFields = apiFieldErrors(result.error);
    if (serverFields) {
      const mapped: FieldErrors = {};
      for (const key of Object.keys(serverFields)) {
        if (fieldKeys.has(key)) mapped[key as FieldKey] = labels.fieldErrors.invalid;
      }
      if (Object.keys(mapped).length > 0) {
        showErrors(mapped);
        return;
      }
    }

    const message = catalogErrorMessage(result.error, errorLabels);
    const field = fieldForCode[errorCode(result.error) ?? ""];
    if (field) {
      showErrors({ [field]: message });
      return;
    }
    setFormError(message);
  };

  const discard = () => {
    setDraft(baseline);
    setFieldErrors({});
    setFormError(null);
  };

  // ---- Fields ----

  const brandOptions = brands.map((b) => ({ value: b.id, label: b.isActive ? b.name : t(labels.hidden, { name: b.name }) }));
  const typeCategories = categories.filter((c) => c.productType === draft.type);
  const categoryOptions = typeCategories.map((c) => {
    const name = localized(c.name, locale);
    return { value: c.id, label: c.isActive ? name : t(labels.hidden, { name }) };
  });

  const typePicker = (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{labels.typeSection}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {productTypes.map((type) => {
          const phone = type === "Phone";
          return (
            <label
              key={type}
              className="group relative flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-foreground/30 has-checked:border-brand has-checked:bg-brand/5 has-checked:ring-1 has-checked:ring-brand has-checked:ring-inset has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand"
            >
              <input type="radio" name="type" value={type} checked={draft.type === type} onChange={() => setType(type)} disabled={disabled} className="sr-only" />
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-brand ring-1 ring-border transition-colors group-has-checked:bg-brand group-has-checked:text-brand-foreground group-has-checked:ring-brand">
                {phone ? <PhoneIcon className="size-5" /> : <HeadphonesIcon className="size-5" />}
              </span>
              <span className="flex flex-col gap-1 pe-6">
                <span className="font-semibold">{phone ? labels.typePhone : labels.typeAccessory}</span>
                <span className="text-sm leading-relaxed text-muted">{phone ? labels.typePhoneBody : labels.typeAccessoryBody}</span>
              </span>
              <CheckIcon className="absolute end-4 top-4 size-5 text-brand opacity-0 transition-opacity group-has-checked:opacity-100" />
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted">{labels.typeHint}</p>
    </fieldset>
  );

  const basics = (
    <div className="flex flex-col gap-5">
      <BilingualField
        label={labels.name}
        hint={labels.nameHint}
        value={draft.name}
        languages={languages}
        disabled={disabled}
        errors={{ en: fieldErrors["name.en"], ar: fieldErrors["name.ar"] }}
        onChange={(name) => update({ name }, ["name.en", "name.ar", ...(draft.slugTouched ? [] : (["slug"] as const))])}
      />

      <Field label={labels.slug} hint={creating ? labels.slugHint : labels.slugEditHint} error={fieldErrors.slug}>
        {(control) => (
          <AdornedInput
            {...control}
            prefix={`/${locale}/products/`}
            value={draft.slugTouched ? draft.slug : effectiveSlug(draft)}
            placeholder={slugify(draft.name.en) || "iphone-16-pro"}
            maxLength={productLimits.slugMax}
            disabled={disabled}
            onChange={(slug) => update({ slug: slug.toLowerCase(), slugTouched: true }, ["slug"])}
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={labels.brand} error={fieldErrors.brandId}>
          {(control) => (
            <SelectField
              {...control}
              value={draft.brandId}
              placeholder={labels.brandPlaceholder}
              options={brandOptions}
              disabled={disabled}
              onChange={(brandId) => update({ brandId }, ["brandId"])}
            />
          )}
        </Field>
        <Field label={labels.category} error={fieldErrors.categoryId} hint={categoryOptions.length === 0 ? labels.noCategories : undefined}>
          {(control) => (
            <SelectField
              {...control}
              value={draft.categoryId}
              placeholder={labels.categoryPlaceholder}
              options={categoryOptions}
              disabled={disabled || categoryOptions.length === 0}
              onChange={(categoryId) => update({ categoryId }, ["categoryId"])}
            />
          )}
        </Field>
      </div>
    </div>
  );

  const description = (
    <BilingualField
      label={labels.description}
      hint={labels.descriptionHint}
      value={draft.description}
      languages={languages}
      multiline
      columns={creating ? "sm" : "xl"}
      maxLength={productLimits.descriptionMax}
      disabled={disabled}
      errors={{ en: fieldErrors["description.en"], ar: fieldErrors["description.ar"] }}
      onChange={(value) => update({ description: value }, ["description.en", "description.ar"])}
    />
  );

  const featured = (
    <Switch
      checked={draft.isFeatured}
      onChange={(isFeatured) => update({ isFeatured })}
      label={labels.featured}
      description={labels.featuredHint}
      disabled={disabled}
    />
  );

  const errorBanner = formError && (
    <p role="alert" className={notice}>
      <AlertIcon />
      {formError}
    </p>
  );

  if (!creating) {
    return (
      <form ref={formRef} noValidate onSubmit={submit}>
        <AdminSection
          id="details"
          title={labels.detailsTitle}
          description={labels.detailsDescription}
          icon={<PencilIcon />}
          footer={<SaveBar dirty={dirty} busy={busy} saved={saved} error={formError} onDiscard={discard} labels={saveBarLabels} />}
        >
          <div className="flex flex-col gap-6">
            {basics}
            <div className="border-t border-border pt-6">{description}</div>
            <div className="border-t border-border pt-6">{featured}</div>
          </div>
        </AdminSection>
      </form>
    );
  }

  const section = (title: string, children: ReactNode) => (
    <section className={formSection}>
      <h2 className={formSectionTitle}>{title}</h2>
      {children}
    </section>
  );

  const steps = [
    { title: labels.stepBasics, body: labels.stepBasicsBody },
    { title: labels.stepOptions, body: labels.stepOptionsBody },
    { title: labels.stepPhotos, body: labels.stepPhotosBody },
    { title: labels.stepPublish, body: labels.stepPublishBody },
  ];

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
      <div className="flex flex-col gap-5">
        {errorBanner}
        {section(labels.typeSection, typePicker)}
        {section(labels.basicsSection, basics)}
        {section(labels.descriptionSection, description)}
        <section className={formSection}>{featured}</section>
      </div>

      <aside className={`${panel} flex flex-col gap-6 p-5 sm:p-6 lg:sticky lg:top-8`}>
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold">{labels.stepsTitle}</h2>
          <ol className="flex flex-col">
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
                {index < steps.length - 1 && <span aria-hidden className="absolute start-3.5 top-8 bottom-1 w-px bg-border" />}
                <span
                  aria-hidden
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    index === 0 ? "bg-brand text-brand-foreground" : "border border-border bg-background text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex flex-col gap-0.5 pt-1">
                  <span className={`text-sm font-medium ${index === 0 ? "" : "text-muted"}`}>{step.title}</span>
                  <span className="text-xs leading-relaxed text-muted">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <button type="submit" disabled={disabled} className={`${buttonPrimary} w-full`}>
            {disabled ? labels.creating : labels.create}
          </button>
          {cancelHref && (
            <Link href={cancelHref} className={`${buttonGhost} w-full`}>
              {labels.cancel}
            </Link>
          )}
        </div>
      </aside>
    </form>
  );
}
