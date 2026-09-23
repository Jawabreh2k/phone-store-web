/**
 * Labels mix Latin and Arabic ("256 GB · 8 GB رام · أسود"). Isolating each segment with <bdi>
 * stops the bidi algorithm from reordering numbers and units across segments in RTL.
 */
export function VariantLabel({ label }: { label: string }) {
  const parts = label.split(" · ");
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && " · "}
          <bdi>{part}</bdi>
        </span>
      ))}
    </span>
  );
}
