"use client";

import { useSyncExternalStore } from "react";
import { CopyLinkButton } from "@/components/copy-link-button";

const subscribe = () => () => {};

interface Props {
  /** Path only (`/en/orders/track/…`). The origin comes from the address bar when the page hydrates. */
  path: string;
  copyLabel: string;
  copiedLabel: string;
}

/** Bookmarkable tracking link. The query string (the one-time confirmation flag) is left off. */
export function TrackingLink({ path, copyLabel, copiedLabel }: Props) {
  const url = useSyncExternalStore(
    subscribe,
    () => window.location.origin + path,
    () => path,
  );

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <p className="min-h-11 min-w-0 flex-1 rounded-xl bg-background px-3 py-2.5 text-sm break-all" dir="ltr">
        {url}
      </p>
      {url && <CopyLinkButton url={url} copyLabel={copyLabel} copiedLabel={copiedLabel} />}
    </div>
  );
}
