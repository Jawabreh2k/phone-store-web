"use client";

import { ChevronDownIcon } from "./icons";
import { fieldSelect } from "./ui";

interface Props {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}

/** A filter select inside a GET form that applies as soon as it changes (the form's button still works without JS). */
export function AdminFilterSelect({ name, label, defaultValue, options }: Props) {
  return (
    <div className="relative">
      <select
        name={name}
        aria-label={label}
        defaultValue={defaultValue}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={`${fieldSelect} bg-surface`}
      >
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
