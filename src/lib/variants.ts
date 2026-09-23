import type { Variant } from "@/lib/api/types";

/** The variant a product page opens on: the first one in stock, else the first. */
export function initialVariant(variants: Variant[]): Variant | undefined {
  return variants.find((v) => v.inStock) ?? variants[0];
}

/** Identifies a colour choice (the swatch). */
export const colorKey = (v: Variant): string | null => v.colorHex ?? v.color;

/** Identifies a memory choice: storage, plus RAM where it comes with it. */
export const memoryKey = (v: Variant): string | null => (v.storageGb === null ? null : `${v.storageGb}:${v.ramGb ?? ""}`);

/** "128 GB", "1 TB". */
export function storageLabel(gb: number): string {
  return gb >= 1024 && gb % 1024 === 0 ? `${gb / 1024} TB` : `${gb} GB`;
}

/**
 * Which choices the picker offers as separate controls (colour swatches, memory options). An axis is used only
 * when every variant has it, and together the axes must single out each variant; otherwise the picker falls
 * back to one flat list of variants. Null means "flat list".
 */
export function variantAxes(variants: Variant[]): { colors: boolean; memory: boolean } | null {
  const colors = variants.every((v) => colorKey(v) !== null);
  const memory = variants.every((v) => memoryKey(v) !== null);
  if (!colors && !memory) return null;
  const keys = variants.map((v) => `${colors ? colorKey(v) : ""}|${memory ? memoryKey(v) : ""}`);
  return new Set(keys).size === keys.length ? { colors, memory } : null;
}
