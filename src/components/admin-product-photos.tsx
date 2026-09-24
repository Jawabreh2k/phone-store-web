"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { flushSync } from "react-dom";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import * as adminApi from "@/lib/api/admin-client";
import { ApiError, type ProductImage } from "@/lib/api/types";
import { acceptedImageTypes, catalogErrorMessage, productLimits } from "@/lib/admin-products";
import { t } from "@/lib/format";
import { useAdminAction } from "@/lib/use-admin-action";
import { AdminDialog } from "./admin-dialog";
import { AdminSection } from "./admin-section";
import { AlertIcon, BackArrowIcon, ArrowIcon, ImageIcon, StarIcon, TrashIcon, UploadIcon } from "./icons";
import { buttonGhost, buttonPrimary, emptyArea, notice } from "./ui";

interface Props {
  locale: Locale;
  productId: string;
  productName: string;
  images: ProductImage[];
  labels: Dictionary["admin"]["photos"];
  errorLabels: Dictionary["admin"]["catalogErrors"];
  closeLabel: string;
}

interface Upload {
  key: string;
  file: File;
  preview: string;
  /** Done uploads stay on screen until the refreshed product lists the saved photo, so nothing flickers. */
  done: boolean;
}

const tileButton =
  "inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-sm transition-colors hover:border-foreground/40 disabled:opacity-50 pointer-coarse:size-10 [&_svg]:size-4";

const sameOrder = (a: ProductImage[], b: ProductImage[]) => a.length === b.length && a.every((image, i) => image.id === b[i].id);

/** Product photos: upload by drop or picker, drag (or use the arrows) to reorder, the first is the cover. */
export function AdminProductPhotos({ locale, productId, productName, images, labels, errorLabels, closeLabel }: Props) {
  const { run, busy } = useAdminAction(locale, { storefront: "catalog" });
  const [saved, setSaved] = useState(images);
  const [order, setOrder] = useState(images);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [removing, setRemoving] = useState<ProductImage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [fileOver, setFileOver] = useState(false);
  const previews = useRef(new Set<string>());
  const listRef = useRef<HTMLUListElement>(null);

  // New server data (after an upload, a removal or a reorder) replaces the local order.
  if (images !== saved) {
    setSaved(images);
    setOrder(images);
    setUploads((current) => current.filter((u) => !u.done));
  }

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const room = productLimits.maxImages - order.length - uploads.length;

  const addFiles = async (files: Iterable<File>) => {
    const found: string[] = [];
    const accepted: Upload[] = [];
    let left = room;
    for (const file of files) {
      const reason = !(acceptedImageTypes as readonly string[]).includes(file.type)
        ? labels.wrongType
        : file.size > productLimits.imageMaxBytes
          ? labels.tooLarge
          : left <= 0
            ? labels.noRoom
            : null;
      if (reason) {
        found.push(t(labels.failed, { name: file.name, reason }));
        continue;
      }
      left--;
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      accepted.push({ key: preview, file, preview, done: false });
    }

    setProblems(found);
    if (accepted.length === 0) return;
    setUploads((current) => [...current, ...accepted]);

    // One at a time, so the photos keep the order they were picked in.
    await run(async () => {
      for (const upload of accepted) {
        try {
          await adminApi.uploadProductImage(locale, productId, upload.file);
          setUploads((current) => current.map((u) => (u.key === upload.key ? { ...u, done: true } : u)));
        } catch (error) {
          if (error instanceof ApiError && (error.problem.status === 401 || error.problem.status === 403)) throw error;
          setUploads((current) => current.filter((u) => u.key !== upload.key));
          setProblems((current) => [...current, t(labels.failed, { name: upload.file.name, reason: catalogErrorMessage(error, errorLabels) })]);
        }
      }
    });
  };

  const persistOrder = async (next: ProductImage[]) => {
    if (sameOrder(next, saved)) return;
    setOrder(next);
    setProblems([]);
    const result = await run(() => adminApi.reorderProductImages(locale, productId, next.map((image) => image.id)));
    if (!result.ok) {
      setOrder(saved);
      setProblems([labels.reorderFailed]);
    }
  };

  const move = (from: number, to: number) => {
    const next = [...order];
    const [image] = next.splice(from, 1);
    next.splice(to, 0, image);
    // The pressed button may not exist in the new spot (the cover has no "make cover"), so keep focus on the photo itself.
    flushSync(() => setOrder(next));
    listRef.current?.querySelector<HTMLElement>(`[data-image="${image.id}"]`)?.focus();
    void persistOrder(next);
  };

  const remove = async (image: ProductImage) => {
    setProblems([]);
    const result = await run(() => adminApi.removeProductImage(locale, productId, image.id));
    setRemoving(null);
    if (result.ok) setOrder((current) => current.filter((i) => i.id !== image.id));
    else setProblems([catalogErrorMessage(result.error, errorLabels)]);
  };

  // ---- Drag and drop: files from the desktop, or a tile onto another tile ----

  const isFileDrag = (event: DragEvent) => event.dataTransfer.types.includes("Files");

  const onZoneDragOver = (event: DragEvent) => {
    if (!isFileDrag(event) || room <= 0) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setFileOver(true);
  };

  const onZoneDrop = (event: DragEvent) => {
    setFileOver(false);
    if (!isFileDrag(event)) return;
    event.preventDefault();
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const onTileDragOver = (event: DragEvent, overId: string) => {
    if (!dragId || isFileDrag(event)) return;
    event.preventDefault();
    if (overId === dragId) return;
    // Live reorder while dragging: the dragged photo takes the hovered photo's place.
    setOrder((current) => {
      const from = current.findIndex((i) => i.id === dragId);
      const to = current.findIndex((i) => i.id === overId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };

  const onTileDragEnd = () => {
    setDragId(null);
    void persistOrder(order);
  };

  const pickerInput = (
    <input
      type="file"
      multiple
      accept={acceptedImageTypes.join(",")}
      disabled={room <= 0}
      className="sr-only"
      onChange={(event) => {
        void addFiles(Array.from(event.target.files ?? []));
        event.target.value = "";
      }}
    />
  );

  const hint = t(labels.dropHint, { remaining: Math.max(0, room) });

  return (
    <AdminSection
      id="photos"
      title={labels.title}
      description={labels.description}
      icon={<ImageIcon />}
      action={
        order.length > 0 && (
          <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium tabular-nums text-muted">
            {order.length}/{productLimits.maxImages}
          </span>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {problems.length > 0 && (
          <div role="alert" className={notice}>
            <AlertIcon />
            <ul className="flex flex-col gap-1">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        {order.length === 0 && uploads.length === 0 ? (
          <label
            onDragOver={onZoneDragOver}
            onDragLeave={() => setFileOver(false)}
            onDrop={onZoneDrop}
            className={`${emptyArea} cursor-pointer py-14 transition-colors hover:border-brand/50 hover:bg-brand/[0.03] has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand ${
              fileOver ? "border-brand bg-brand/5" : ""
            }`}
          >
            <span aria-hidden className="inline-flex size-14 items-center justify-center rounded-full bg-brand/5 text-brand">
              <UploadIcon className="size-6" />
            </span>
            <span className="font-semibold">{labels.dropTitle}</span>
            <span className="max-w-sm text-sm leading-relaxed text-muted">{hint}</span>
            <span className="text-xs text-muted">{labels.empty}</span>
            {pickerInput}
          </label>
        ) : (
          <ul ref={listRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {order.map((image, index) => (
              <li
                key={image.id}
                data-image={image.id}
                tabIndex={-1}
                aria-label={t(labels.photoAlt, { name: productName, n: index + 1 })}
                draggable={!busy}
                onDragStart={(event) => {
                  setDragId(image.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => onTileDragOver(event, image.id)}
                onDrop={(event) => event.preventDefault()}
                onDragEnd={onTileDragEnd}
                className={`group relative aspect-square overflow-hidden rounded-2xl border bg-background transition-[opacity,box-shadow,border-color] ${
                  dragId === image.id ? "border-brand opacity-50" : "border-border hover:shadow-lift"
                } ${busy ? "" : "cursor-grab active:cursor-grabbing"}`}
              >
                {/* The tile carries the name ("…, photo 2"), so the picture itself stays unannounced. */}
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 12rem, (min-width: 640px) 30vw, 45vw"
                  className="pointer-events-none object-contain p-3"
                />
                {index === 0 && (
                  <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-foreground">
                    <StarIcon className="size-3" />
                    {labels.cover}
                  </span>
                )}
                {/* Always visible on touch screens; revealed on hover or keyboard focus with a mouse. */}
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 transition-opacity pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(index, index - 1)} disabled={busy || index === 0} aria-label={labels.moveEarlier} className={tileButton}>
                      <BackArrowIcon />
                    </button>
                    <button type="button" onClick={() => move(index, index + 1)} disabled={busy || index === order.length - 1} aria-label={labels.moveLater} className={tileButton}>
                      <ArrowIcon />
                    </button>
                    {index > 0 && (
                      <button type="button" onClick={() => move(index, 0)} disabled={busy} aria-label={labels.makeCover} title={labels.makeCover} className={tileButton}>
                        <StarIcon />
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => setRemoving(image)} disabled={busy} aria-label={labels.remove} className={`${tileButton} hover:text-accent`}>
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}

            {uploads.map((upload) => (
              <li key={upload.key} aria-busy="true" className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
                <Image src={upload.preview} alt="" fill unoptimized className="object-contain p-3 opacity-40 blur-[1px]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span className="size-7 rounded-full border-2 border-brand/20 border-t-brand motion-safe:animate-spin" />
                  <span className="text-xs font-medium">{labels.uploading}</span>
                </div>
              </li>
            ))}

            {room > 0 && (
              <li>
                <label
                  onDragOver={onZoneDragOver}
                  onDragLeave={() => setFileOver(false)}
                  onDrop={onZoneDrop}
                  className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-3 text-center transition-colors hover:border-brand/50 hover:bg-brand/[0.03] has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-brand ${
                    fileOver ? "border-brand bg-brand/5" : "border-foreground/20"
                  }`}
                >
                  <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-full bg-brand/5 text-brand">
                    <UploadIcon className="size-5" />
                  </span>
                  <span className="text-sm font-medium">{labels.add}</span>
                  <span className="text-xs text-muted">{t(labels.left, { count: room })}</span>
                  {pickerInput}
                </label>
              </li>
            )}
          </ul>
        )}

        {order.length > 0 && room <= 0 && uploads.length === 0 && <p className="text-xs text-muted">{labels.full}</p>}
      </div>

      <AdminDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        busy={busy}
        title={labels.removeTitle}
        description={labels.removeBody}
        closeLabel={closeLabel}
        footer={
          <>
            <button type="button" onClick={() => setRemoving(null)} disabled={busy} className={buttonGhost}>
              {labels.cancel}
            </button>
            <button type="button" onClick={() => removing && void remove(removing)} disabled={busy} className={`${buttonPrimary} h-11 px-6`}>
              {busy ? labels.removing : labels.removeConfirm}
            </button>
          </>
        }
      >
        {removing && (
          <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-2xl border border-border bg-background">
            <Image src={removing.url} alt="" fill sizes="10rem" className="object-contain p-3" />
          </div>
        )}
      </AdminDialog>
    </AdminSection>
  );
}
