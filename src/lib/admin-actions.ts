"use server";

import { updateTag } from "next/cache";
import { getAdminGate } from "@/lib/admin-auth";
import { storefrontTags, type StorefrontTag } from "@/lib/storefront-tags";

const knownTags = new Set<string>(Object.values(storefrontTags));

/**
 * Expires the store's cached copy of what staff just changed, so the next storefront view reads it fresh.
 * A Server Action is a public endpoint, so it checks the staff session first and ignores unknown tags.
 */
export async function refreshStorefront(tag: StorefrontTag): Promise<void> {
  if (!knownTags.has(tag)) return;
  // The language only picks the API's response text; any works for a session check.
  const gate = await getAdminGate("en");
  if (gate.kind !== "admin") return;
  updateTag(tag);
}
