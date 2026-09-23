"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { buttonSecondary } from "@/components/ui";

interface Props {
  url: string;
  copyLabel: string;
  copiedLabel: string;
}

export function CopyLinkButton({ url, copyLabel, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard without a user gesture context.
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button type="button" onClick={copy} className={buttonSecondary}>
      {copied ? (
        <>
          <CheckIcon />
          {copiedLabel}
        </>
      ) : (
        copyLabel
      )}
    </button>
  );
}
