import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Listing } from "@/models/Listing";
import { objectIdSchema } from "@/lib/schemas";
import {
  deleteImage,
  imageKeyFromUrl,
  ImageUploadError,
  readPreparedImage,
  saveImage,
  type StoredImage,
} from "@/lib/imageStorage";
import { MAX_LISTING_IMAGES } from "@/lib/images";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: objectIdSchema });
const reorderSchema = z.object({
  order: z.array(z.string().max(500)).min(1).max(MAX_LISTING_IMAGES),
});
const removeSchema = z.object({ url: z.string().max(500) });

export async function POST(
  request: Request,
  context: RouteContext<"/api/listings/[id]/images">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    const { id } = paramsSchema.parse(await context.params);

    const formData = await request.formData().catch(() => null);
    if (!formData) return fail("Expected multipart form data", 400);
    const files = formData
      .getAll("images")
      .filter((entry): entry is File => typeof entry !== "string" && entry.size > 0);
    if (files.length === 0) return fail("Choose at least one photo", 400);

    await connectDB();
    const listing = await Listing.findById(id);
    if (!listing) return fail("Listing not found", 404);
    if (listing.host.toString() !== session.userId) {
      return fail("Only the host can manage photos", 403);
    }
    if (listing.images.length + files.length > MAX_LISTING_IMAGES) {
      return fail(`A listing can have at most ${MAX_LISTING_IMAGES} photos`, 400);
    }

    const prepared = [];
    for (const file of files) {
      try {
        prepared.push(await readPreparedImage(file));
      } catch (error) {
        if (error instanceof ImageUploadError) return fail(error.message, 400);
        throw error;
      }
    }

    const saved: StoredImage[] = [];
    try {
      for (const image of prepared) saved.push(await saveImage(id, image));
      await Listing.updateOne(
        { _id: id },
        { $push: { images: { $each: saved.map((item) => item.url) } } },
      );
    } catch (error) {
      await Promise.allSettled(saved.map((item) => deleteImage(item.key)));
      throw error;
    }

    return ok(
      {
        images: [...listing.images, ...saved.map((item) => item.url)],
        uploaded: saved.map((item) => ({
          id: item.id,
          url: item.url,
          bytes: item.bytes,
          contentType: item.contentType,
        })),
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/listings/[id]/images">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    const { id } = paramsSchema.parse(await context.params);
    const { order } = reorderSchema.parse(await readJson(request));

    await connectDB();
    const listing = await Listing.findById(id);
    if (!listing) return fail("Listing not found", 404);
    if (listing.host.toString() !== session.userId) {
      return fail("Only the host can manage photos", 403);
    }

    const current: string[] = listing.images ?? [];
    if (
      order.length !== current.length ||
      new Set(order).size !== order.length ||
      order.some((url) => !current.includes(url))
    ) {
      return fail("Order must list each photo exactly once", 400);
    }

    await Listing.updateOne({ _id: id }, { $set: { images: order } });
    return ok({ images: order });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/listings/[id]/images">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    const { id } = paramsSchema.parse(await context.params);
    const { url } = removeSchema.parse(await readJson(request));

    await connectDB();
    const listing = await Listing.findById(id);
    if (!listing) return fail("Listing not found", 404);
    if (listing.host.toString() !== session.userId) {
      return fail("Only the host can manage photos", 403);
    }

    const current: string[] = listing.images ?? [];
    if (!current.includes(url)) return fail("Photo not found on this listing", 404);
    const remaining = current.filter((item) => item !== url);

    await Listing.updateOne({ _id: id }, { $set: { images: remaining } });
    const key = imageKeyFromUrl(url);
    if (key) await deleteImage(key);
    return ok({ images: remaining });
  } catch (error) {
    return handleError(error);
  }
}
