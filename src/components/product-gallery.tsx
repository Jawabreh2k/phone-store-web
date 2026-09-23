"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { t } from "@/lib/format";
import { ArrowIcon, CloseIcon } from "./icons";
import { iconButton, swipeRow } from "./ui";

interface Props {
  images: { id: string; url: string }[];
  name: string;
  labels: { viewLarger: string; close: string; previous: string; next: string; photoOf: string };
}


/**
 * Product photos: a swipeable strip (CSS scroll-snap) with thumbnails and, on larger screens, arrows.
 * Any photo opens a full-screen viewer (native <dialog>: focus trap and Escape for free) where a click
 * toggles 2x zoom around the pointer.
 */
export function ProductGallery({ images, name, labels }: Props) {
  const count = images.length;
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLDialogElement>(null);

  const photoLabel = (index: number) => t(labels.photoOf, { n: index + 1, total: count });

  // RTL strips scroll towards negative scrollLeft in current browsers, so work with the magnitude and flip.
  const scrollTo = (index: number, behavior: ScrollBehavior = "smooth") => {
    const el = track.current;
    if (!el) return;
    const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: sign * index * el.clientWidth, behavior });
  };

  const show = (index: number, behavior: ScrollBehavior = "smooth") => {
    const next = (index + count) % count;
    setActive(next);
    setZoom(null);
    scrollTo(next, behavior);
  };

  const onStripScroll = () => {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.min(count - 1, Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    if (index !== active) setActive(index);
  };

  const openViewer = (index: number) => {
    setActive(index);
    setZoom(null);
    viewer.current?.showModal();
  };

  // Arrow keys follow the reading direction: in Arabic, ArrowLeft means "next".
  const onViewerKey = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const rtl = document.documentElement.dir === "rtl";
    const forward = (event.key === "ArrowRight") !== rtl;
    show(active + (forward ? 1 : -1), "auto");
  };

  const toggleZoom = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (zoom) {
      setZoom(null);
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    setZoom({ x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 });
  };

  const panZoom = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!zoom) return;
    const box = event.currentTarget.getBoundingClientRect();
    setZoom({ x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative">
        <div
          ref={track}
          onScroll={onStripScroll}
          aria-label={name}
          className={`flex snap-x snap-mandatory rounded-panel border border-border/70 ${swipeRow}`}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openViewer(index)}
              aria-label={`${labels.viewLarger}: ${photoLabel(index)}`}
              className="relative aspect-square w-full shrink-0 cursor-zoom-in snap-center bg-surface md:aspect-[4/5]"
            >
              <Image
                src={image.url}
                alt={index === 0 ? name : ""}
                fill
                preload={index === 0}
                sizes="(min-width: 1280px) 680px, (min-width: 768px) 55vw, 100vw"
                className="object-contain p-8 sm:p-12"
              />
            </button>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => show(active - 1)}
              aria-label={labels.previous}
              className={`${iconButton} absolute start-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:hidden`}
            >
              <ArrowIcon className="size-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => show(active + 1)}
              aria-label={labels.next}
              className={`${iconButton} absolute end-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-md:hidden`}
            >
              <ArrowIcon />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className={`-mx-1 flex gap-2 px-1 py-1 ${swipeRow}`}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => show(index)}
              aria-label={photoLabel(index)}
              aria-current={index === active ? "true" : undefined}
              className={`relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-surface transition sm:size-20 ${
                index === active ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={viewer}
        onKeyDown={onViewerKey}
        onClose={() => setZoom(null)}
        aria-label={name}
        className="m-0 size-full max-h-none max-w-none bg-background p-0 text-foreground backdrop:bg-foreground/40"
      >
        <div className="flex size-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <span className="text-sm text-muted">{count > 1 ? photoLabel(active) : name}</span>
            <button type="button" onClick={() => viewer.current?.close()} aria-label={labels.close} className={iconButton}>
              <CloseIcon />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <button
              type="button"
              onClick={toggleZoom}
              onMouseMove={panZoom}
              aria-label={labels.viewLarger}
              className={`absolute inset-0 ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            >
              {images[active] && (
                <Image
                  key={images[active].id}
                  src={images[active].url}
                  alt={active === 0 ? name : ""}
                  fill
                  sizes="100vw"
                  className="object-contain p-4 motion-safe:transition-transform motion-safe:duration-300 sm:p-10"
                  style={{
                    transform: zoom ? "scale(2)" : undefined,
                    transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : undefined,
                  }}
                />
              )}
            </button>

            {count > 1 && (
              <>
                <button type="button" onClick={() => show(active - 1, "auto")} aria-label={labels.previous} className={`${iconButton} absolute start-4 top-1/2 -translate-y-1/2`}>
                  <ArrowIcon className="size-4 rotate-180" />
                </button>
                <button type="button" onClick={() => show(active + 1, "auto")} aria-label={labels.next} className={`${iconButton} absolute end-4 top-1/2 -translate-y-1/2`}>
                  <ArrowIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
