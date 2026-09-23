import { notFound } from "next/navigation";

/**
 * Any URL under a language that matches no page. [lang]/not-found.tsx only renders for notFound() calls inside
 * this layout, so without this catch-all an unknown path got Next's bare default 404 (no header, footer or brand).
 */
export default function UnknownPage() {
  notFound();
}
