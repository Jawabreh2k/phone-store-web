"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { buttonPrimary } from "./ui";

interface Props {
  labels: Dictionary["cart"];
  onRetry: () => Promise<void>;
}

/** Shown by the cart and checkout when the cart could not be loaded. */
export function CartLoadError({ labels, onRetry }: Props) {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-surface px-6 py-20 text-center sm:py-28" role="alert">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{labels.loadErrorTitle}</h2>
      <p className="max-w-sm text-muted">{labels.loadErrorBody}</p>
      <button type="button" onClick={retry} disabled={retrying} className={buttonPrimary}>
        {retrying ? "…" : labels.retry}
      </button>
    </div>
  );
}
