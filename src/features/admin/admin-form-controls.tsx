"use client";

import { useId, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { LocalizedText } from "@/lib/api/types";
import { ChevronDownIcon } from "@/components/ui/icons";
import { fieldGroup, fieldHint, fieldInput, fieldLabel, fieldSelect, langTag } from "@/components/ui/ui";

/** The attributes that tie a control to its label, hint and error. Spread them onto the input. */
export interface ControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Shown after the label, e.g. "Optional". */
  note?: string;
  /** Right-aligned beside the label: a character count, a "Suggest" button. */
  aside?: ReactNode;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}

/** Label, control, hint and error with the ids wired up, so every field is announced the same way. */
export function Field({ label, hint, error, note, aside, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`${fieldGroup} ${className ?? ""}`}>
      <div className="flex min-h-5 items-baseline justify-between gap-3">
        <label htmlFor={id} className={fieldLabel}>
          {label}
          {note && <span className="ms-1.5 text-xs font-normal text-muted">{note}</span>}
        </label>
        {aside}
      </div>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error && (
        <p id={errorId} className={fieldHint}>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/** "12 / 200" under a long text field; turns accent when over the limit. */
export function CharacterCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span aria-hidden className={`text-xs tabular-nums ${over ? "font-medium text-accent" : "text-muted"}`}>
      {value.length.toLocaleString("en")}/{max.toLocaleString("en")}
    </span>
  );
}

export interface LanguageLabels {
  english: string;
  arabic: string;
}

const languageMeta = {
  en: { dir: "ltr", tag: "EN" },
  ar: { dir: "rtl", tag: "ع" },
} as const;

interface LangInputProps {
  language: Locale;
  value: string;
  onChange: (value: string) => void;
  /** Accessible name, e.g. "Name, English". The visible tag is only "EN" / "ع". */
  label: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}

/**
 * One language of a bilingual value. The input takes that language's direction, so Arabic types right to
 * left even on the English admin, and a small tag at its start says which language it is.
 */
export function LangInput({ language, value, onChange, label, multiline, rows = 5, maxLength, invalid, describedBy, disabled, placeholder, compact }: LangInputProps) {
  const { dir, tag } = languageMeta[language];
  const shared = {
    value,
    dir,
    lang: language,
    "aria-label": label,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    disabled,
    placeholder,
    maxLength,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    className: `${fieldInput} ps-14 ${compact ? "py-2.5" : ""} ${multiline ? "min-h-32 resize-y leading-relaxed" : ""}`,
  };

  return (
    <div dir={dir} className="relative">
      <span aria-hidden className={`${langTag} ${compact ? "top-2" : ""}`}>
        {tag}
      </span>
      {multiline ? <textarea rows={rows} {...shared} /> : <input type="text" {...shared} />}
    </div>
  );
}

interface BilingualFieldProps {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  languages: LanguageLabels;
  errors?: Partial<Record<keyof LocalizedText, string>>;
  hint?: string;
  multiline?: boolean;
  /** Shows a live character count under each input. */
  maxLength?: number;
  disabled?: boolean;
  /** Side by side from this breakpoint; long text reads better stacked until the column is wide. */
  columns?: "sm" | "xl";
}

/** A text staff enter in English and Arabic, side by side, as customers see it in each store language. */
export function BilingualField({ label, value, onChange, languages, errors = {}, hint, multiline, maxLength, disabled, columns = "sm" }: BilingualFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <fieldset className={fieldGroup}>
      <legend className={`${fieldLabel} mb-2`}>{label}</legend>
      <div className={`grid gap-3 ${columns === "sm" ? "sm:grid-cols-2" : "xl:grid-cols-2"}`}>
        {(["en", "ar"] as const).map((language) => {
          const error = errors[language];
          const errorId = error ? `${id}-${language}-error` : undefined;
          return (
            <div key={language} className="flex flex-col gap-1.5">
              <LangInput
                language={language}
                value={value[language]}
                onChange={(next) => onChange({ ...value, [language]: next })}
                label={`${label}, ${language === "en" ? languages.english : languages.arabic}`}
                multiline={multiline}
                invalid={Boolean(error)}
                describedBy={[errorId, hintId].filter(Boolean).join(" ") || undefined}
                disabled={disabled}
              />
              {(error || (multiline && maxLength)) && (
                <div className="flex items-start justify-between gap-3">
                  {error ? (
                    <p id={errorId} className={fieldHint}>
                      {error}
                    </p>
                  ) : (
                    <span />
                  )}
                  {multiline && maxLength && <CharacterCount value={value[language]} max={maxLength} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </fieldset>
  );
}

interface SelectFieldProps extends ControlProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

/** Native select (the best picker on phones) in the field style, with the chevron on the end side. */
export function SelectField({ value, onChange, placeholder, options, disabled, ...control }: SelectFieldProps) {
  return (
    <div className="relative">
      <select {...control} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={fieldSelect}>
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label; omit it and pass ariaLabel for a bare switch in a table row. */
  label?: string;
  description?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

/** On/off setting that applies as a whole (featured, active). A checkbox underneath, announced as a switch. */
export function Switch({ checked, onChange, label, description, ariaLabel, disabled }: SwitchProps) {
  const track = (
    <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-foreground/15 transition-colors has-checked:bg-brand has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="ms-0.5 size-5 rounded-full bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.2)] transition-transform duration-200 peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
      />
    </span>
  );

  if (!label) return <label className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>{track}</label>;

  return (
    <label className={`flex items-start justify-between gap-6 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs leading-relaxed text-muted">{description}</span>}
      </span>
      {track}
    </label>
  );
}

interface AdornedInputProps extends ControlProps {
  value: string;
  onChange: (value: string) => void;
  /** Text after the value, such as the currency ("JOD") or a unit. */
  suffix?: ReactNode;
  prefix?: ReactNode;
  inputMode?: "decimal" | "numeric" | "text";
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  /** Where focus starts when this sits in an AdminDialog. */
  dialogAutoFocus?: boolean;
}

/**
 * A left-to-right input with fixed text beside the value: a price and its currency, a link and its path.
 * Numbers go through a text input (not type=number) so Arabic-Indic digits typed on an Arabic keyboard still work.
 */
export function AdornedInput({ value, onChange, suffix, prefix, inputMode = "text", placeholder, disabled, maxLength, className, dialogAutoFocus, ...control }: AdornedInputProps) {
  return (
    // The focus ring goes on the whole box, not just the text inside it; the inline style beats the global :focus-visible rule.
    <div
      dir="ltr"
      className="flex items-stretch rounded-2xl border border-border bg-background transition-colors focus-within:border-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand has-[[aria-invalid=true]]:border-accent"
    >
      {prefix && <span className="flex items-center ps-4 text-sm whitespace-nowrap text-muted select-none">{prefix}</span>}
      <input
        {...control}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        data-autofocus={dialogAutoFocus || undefined}
        style={{ outline: "none" }}
        className={`min-w-0 flex-1 rounded-2xl bg-transparent py-3 text-sm text-foreground placeholder:text-muted ${prefix ? "ps-0.5" : "ps-4"} ${suffix ? "pe-2" : "pe-4"} ${className ?? ""}`}
      />
      {suffix && <span className="flex items-center pe-4 text-sm font-medium whitespace-nowrap text-muted select-none">{suffix}</span>}
    </div>
  );
}
