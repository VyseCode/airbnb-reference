export const MAX_LISTING_IMAGES = 10;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPTED_IMAGE_ATTR = ACCEPTED_IMAGE_TYPES.join(",");
