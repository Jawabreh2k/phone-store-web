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
    const markCopied = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    };

    try {
      await navigator.clipboard.writeText(url);
      markCopied();
    } catch {
      // Fallback for browsers that block the clipboard API. Only confirm when the copy actually lands.
      const input = document.createElement("input");
      input.value = url;
      input.setAttribute("aria-hidden", "true");
      input.tabIndex = -1;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.focus();
      input.select();
      const copiedOk = document.execCommand("copy");
      document.body.removeChild(input);
      if (copiedOk) markCopied();
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
