"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { CartIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/state-panel";
import { buttonPrimary } from "@/components/ui/ui";

interface Props {
  labels: Dictionary["cart"];
  onRetry: () => Promise<unknown>;
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
    <StatePanel role="alert" as="h2" tone="accent" visual={<CartIcon className="size-10" />} title={labels.loadErrorTitle} body={labels.loadErrorBody}>
      <button type="button" onClick={retry} disabled={retrying} className={buttonPrimary}>
        {retrying ? "…" : labels.retry}
      </button>
    </StatePanel>
  );
}
