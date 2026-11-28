"use client";

import { useRef, useState } from "react";
import { ACCEPTED_IMAGE_ATTR, MAX_LISTING_IMAGES } from "@/lib/images";

type Preview = { file: File; url: string };

type ImageGalleryManagerProps = {
  listingId?: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  onFilesChange?: (files: File[]) => void;
};

async function errorMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
}

export function ImageGalleryManager({
  listingId,
  images,
  onImagesChange,
  onFilesChange,
}: ImageGalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const managed = Boolean(listingId);
  const shown = managed ? images : previews.map((item) => item.url);

  async function addFiles(fileList: FileList | null) {
    const incoming = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (incoming.length === 0) return;
    setError("");
    if (shown.length + incoming.length > MAX_LISTING_IMAGES) {
      setError(`You can add at most ${MAX_LISTING_IMAGES} photos.`);
      return;
    }

    if (!managed) {
      const next = [
        ...previews,
        ...incoming.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ];
      setPreviews(next);
      onFilesChange?.(next.map((item) => item.file));
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      for (const file of incoming) form.append("images", file);
      const response = await fetch(`/api/listings/${listingId}/images`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        setError(await errorMessage(response, "Could not upload your photos"));
        return;
      }
      const data = (await response.json()) as { images: string[] };
      onImagesChange(data.images);
    } catch {
      setError("Could not upload your photos. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= shown.length) return;
    setError("");

    if (!managed) {
      const next = [...previews];
      [next[index], next[target]] = [next[target], next[index]];
      setPreviews(next);
      onFilesChange?.(next.map((item) => item.file));
      return;
    }

    const order = [...shown];
    [order[index], order[target]] = [order[target], order[index]];
    setBusy(true);
    try {
      const response = await fetch(`/api/listings/${listingId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!response.ok) {
        setError(await errorMessage(response, "Could not reorder your photos"));
        return;
      }
      const data = (await response.json()) as { images: string[] };
      onImagesChange(data.images);
    } catch {
      setError("Could not reorder your photos. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(index: number) {
    setError("");
    if (!managed) {
      const next = [...previews];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      setPreviews(next);
      onFilesChange?.(next.map((item) => item.file));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/listings/${listingId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: shown[index] }),
      });
      if (!response.ok) {
        setError(await errorMessage(response, "Could not remove your photo"));
        return;
      }
      const data = (await response.json()) as { images: string[] };
      onImagesChange(data.images);
    } catch {
      setError("Could not remove your photo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Photos</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {shown.length}/{MAX_LISTING_IMAGES} · use the arrows to set the cover photo
          </p>
        </div>
        <button
          type="button"
          disabled={busy || shown.length >= MAX_LISTING_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "Working..." : "Add photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_ATTR}
          className="hidden"
          onChange={(event) => void addFiles(event.target.files)}
        />
      </div>

      {shown.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((src, index) => (
            <li key={src} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="relative aspect-[4/3] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  {index + 1}
                </span>
              </div>
              <div className="flex gap-1 p-2">
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} left`}
                  disabled={busy || index === 0}
                  onClick={() => void move(index, -1)}
                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} right`}
                  disabled={busy || index === shown.length - 1}
                  onClick={() => void move(index, 1)}
                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
                >
                  →
                </button>
                <button
                  type="button"
                  aria-label={`Remove photo ${index + 1}`}
                  disabled={busy}
                  onClick={() => void remove(index)}
                  className="ml-auto rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          No photos yet. Upload JPEG, PNG, WebP or GIF files (up to 8 MB each).
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
