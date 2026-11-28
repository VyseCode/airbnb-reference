import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Types } from "mongoose";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
} as const;

type Extension = keyof typeof CONTENT_TYPES;

export type PreparedImage = {
  bytes: Buffer;
  extension: Extension;
  contentType: string;
};

export type StoredImage = {
  id: string;
  key: string;
  url: string;
  bytes: number;
  contentType: string;
};

const KEY_PATTERN = /^listings\/[0-9a-f]{24}\/[0-9a-f]{24}\.(jpg|png|webp|gif)$/;
const CDN_PREFIX = "/cdn/";
const cdnBase = (process.env.CDN_BASE_URL ?? "").trim().replace(/\/+$/, "");
const uploadRoot = path.resolve(
  /* turbopackIgnore: true */ process.env.UPLOAD_DIR ||
    path.join(process.cwd(), ".data", "uploads"),
);

export class ImageUploadError extends Error {}

function matchesSignature(bytes: Buffer, extension: Extension): boolean {
  if (extension === "jpg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (extension === "png") {
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (extension === "gif") {
    const header = bytes.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }
  return (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

export async function readPreparedImage(file: File): Promise<PreparedImage> {
  const declaredType = file.type.toLowerCase();
  const extension = (Object.keys(CONTENT_TYPES) as Extension[]).find(
    (ext) => CONTENT_TYPES[ext] === declaredType,
  );

  if (!extension) {
    throw new ImageUploadError("Only JPEG, PNG, WebP and GIF photos are supported");
  }
  if (file.size === 0) {
    throw new ImageUploadError("Uploaded photos cannot be empty");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageUploadError(
      `Each photo must be smaller than ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`,
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(bytes, extension)) {
    throw new ImageUploadError("Photo contents do not match the declared image type");
  }
  return { bytes, extension, contentType: declaredType };
}

export async function saveImage(
  listingId: string,
  image: PreparedImage,
): Promise<StoredImage> {
  const target = resolveListingDir(listingId);
  const id = new Types.ObjectId().toString();
  const key = `listings/${listingId}/${id}.${image.extension}`;
  const filePath = path.resolve(uploadRoot, ...key.split("/"));
  await mkdir(target, { recursive: true });
  await writeFile(filePath, image.bytes, { flag: "wx" });
  return {
    id,
    key,
    url: imageUrlForKey(key),
    bytes: image.bytes.length,
    contentType: image.contentType,
  };
}

export function imageUrlForKey(key: string): string {
  return cdnBase ? `${cdnBase}/${key}` : `${CDN_PREFIX}${key}`;
}

export function imageKeyFromUrl(url: string): string | null {
  let key: string | null = null;
  if (cdnBase && url.startsWith(`${cdnBase}/`)) {
    key = url.slice(cdnBase.length + 1);
  } else if (url.startsWith(CDN_PREFIX)) {
    key = url.slice(CDN_PREFIX.length);
  }
  return key && KEY_PATTERN.test(key) ? key : null;
}

function resolveListingDir(listingId: string): string {
  if (!Types.ObjectId.isValid(listingId)) {
    throw new ImageUploadError("Invalid listing id");
  }
  const target = path.resolve(uploadRoot, "listings", listingId);
  if (!target.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new ImageUploadError("Invalid listing id");
  }
  return target;
}

function resolveKey(key: string): string {
  if (!KEY_PATTERN.test(key)) throw new ImageUploadError("Invalid image key");
  const target = path.resolve(uploadRoot, ...key.split("/"));
  if (!target.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new ImageUploadError("Invalid image key");
  }
  return target;
}

export async function deleteImage(key: string): Promise<void> {
  await rm(resolveKey(key), { force: true });
}

export async function deleteListingImages(listingId: string): Promise<void> {
  await rm(resolveListingDir(listingId), { recursive: true, force: true });
}

export async function readImage(key: string): Promise<{
  bytes: Buffer;
  contentType: string;
  etag: string;
  lastModified: string;
} | null> {
  let target: string;
  try {
    target = resolveKey(key);
  } catch {
    return null;
  }
  try {
    const [bytes, info] = await Promise.all([readFile(target), stat(target)]);
    const extension = key.split(".").pop() as Extension;
    return {
      bytes,
      contentType: CONTENT_TYPES[extension],
      etag: `"${createHash("sha256").update(bytes).digest("hex").slice(0, 24)}"`,
      lastModified: info.mtime.toUTCString(),
    };
  } catch {
    return null;
  }
}
