import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { fail, handleError, isDuplicateKeyError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Listing } from "@/models/Listing";
import { Review } from "@/models/Review";
import { objectIdSchema, reviewCreateSchema } from "@/lib/schemas";
import { getListingReviews } from "@/lib/queries";
import { z } from "zod";

const paramsSchema = z.object({ id: objectIdSchema });

export async function GET(
  _request: Request,
  context: RouteContext<"/api/listings/[id]/reviews">,
) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    await connectDB();
    return ok({ reviews: await getListingReviews(id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/listings/[id]/reviews">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const body = reviewCreateSchema.parse(await readJson(request));
    await connectDB();

    const booking = await Booking.findById(body.bookingId).select(
      "listing guest status",
    );
    if (!booking || booking.listing.toString() !== id) {
      return fail("Booking not found for this listing", 404);
    }
    if (booking.guest.toString() !== session.userId) {
      return fail("Only the guest can review this stay", 403);
    }
    if (booking.status !== "completed") {
      return fail("You can only review a completed stay", 403);
    }
    if (await Review.exists({ booking: booking._id })) {
      return fail("You have already reviewed this stay", 409);
    }

    const review = await Review.create({
      booking: booking._id,
      listing: new Types.ObjectId(id),
      author: new Types.ObjectId(session.userId),
      rating: body.rating,
      comment: body.comment,
    });

    const stats = await Review.aggregate([
      { $match: { listing: new Types.ObjectId(id) } },
      { $group: { _id: "$listing", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const stat = stats[0] ?? { avg: 0, count: 0 };
    await Listing.updateOne(
      { _id: id },
      {
        $set: {
          ratingAvg: Math.round(stat.avg * 10) / 10,
          ratingCount: stat.count,
        },
      },
    );

    return ok(
      {
        review: {
          id: review._id.toString(),
          bookingId: booking._id.toString(),
          authorId: session.userId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return fail("You have already reviewed this stay", 409);
    }
    return handleError(error);
  }
}
