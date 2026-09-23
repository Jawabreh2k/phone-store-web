import { Fragment, type ReactNode } from "react";

/**
 * A dictionary template whose {placeholders} are React nodes, e.g. a price wrapped in <bdi> inside an Arabic
 * sentence. Plain-string values go through t() in lib/format instead.
 */
export function Fill({ template, values }: { template: string; values: Record<string, ReactNode> }) {
  return (
    <>
      {template.split(/(\{\w+\})/).map((part, i) => {
        const key = /^\{(\w+)\}$/.exec(part)?.[1];
        return <Fragment key={i}>{key && key in values ? values[key] : part}</Fragment>;
      })}
    </>
  );
}
