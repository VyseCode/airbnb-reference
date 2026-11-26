import { readImage } from "@/lib/imageStorage";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  request: Request,
  context: RouteContext<"/cdn/[...key]">,
) {
  const { key } = await context.params;
  const image = await readImage(key.join("/"));
  if (!image) {
    return new Response("Photo not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const headers = {
    ...CACHE_HEADERS,
    "Content-Type": image.contentType,
    "Content-Length": String(image.bytes.length),
    "Last-Modified": image.lastModified,
    ETag: image.etag,
  };

  if (request.headers.get("if-none-match") === image.etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(new Uint8Array(image.bytes), { headers });
}
