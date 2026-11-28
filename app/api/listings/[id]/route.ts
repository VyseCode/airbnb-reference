import { Types } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Listing } from "@/models/Listing";
import { Booking } from "@/models/Booking";
import { BlockedDate } from "@/models/BlockedDate";
import { Review } from "@/models/Review";
import { Wishlist } from "@/models/Wishlist";
import { listingUpdateSchema, objectIdSchema } from "@/lib/schemas";
import { getListingById } from "@/lib/queries";
import { deleteListingImages } from "@/lib/imageStorage";

const paramsSchema = z.object({
  id: objectIdSchema,
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/listings/[id]">,
) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    const session = await getSession();
    await connectDB();
    const listing = await getListingById(id, session?.userId ?? "");
    if (!listing) return fail("Listing not found", 404);
    return ok({ listing });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/listings/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const body = listingUpdateSchema.parse(await readJson(request));
    if (Object.keys(body).length === 0) return fail("No changes supplied", 400);

    await connectDB();
    const listing = await Listing.findById(id);
    if (!listing) return fail("Listing not found", 404);
    if (listing.host.toString() !== session.userId) {
      return fail("Only the host can edit this listing", 403);
    }

    const set: Record<string, unknown> = {};
    for (const key of [
      "title",
      "description",
      "propertyType",
      "pricePerNight",
      "capacity",
      "amenities",
      "images",
    ] as const) {
      if (body[key] !== undefined) set[key] = body[key];
    }
    const location: Record<string, string> = {};
    if (body.city !== undefined) location.city = body.city;
    if (body.country !== undefined) location.country = body.country;
    if (body.address !== undefined) location.address = body.address;
    if (Object.keys(location).length > 0) {
      for (const [key, value] of Object.entries(location)) {
        set[`location.${key}`] = value;
      }
    }

    await Listing.updateOne({ _id: id }, { $set: set });
    const updated = await getListingById(id, session.userId);
    return ok({ listing: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/listings/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    await connectDB();
    const listing = await Listing.findById(id).select("host images");
    if (!listing) return fail("Listing not found", 404);
    if (listing.host.toString() !== session.userId) {
      return fail("Only the host can delete this listing", 403);
    }

    const objectId = new Types.ObjectId(id);
    await Promise.all([
      Booking.deleteMany({ listing: objectId }),
      BlockedDate.deleteMany({ listing: objectId }),
      Review.deleteMany({ listing: objectId }),
      Wishlist.deleteMany({ listing: objectId }),
    ]);
    const storedImages = listing.get("images") as string[] | undefined;
    await Listing.deleteOne({ _id: objectId });
    if (storedImages?.length) await deleteListingImages(id);

    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
