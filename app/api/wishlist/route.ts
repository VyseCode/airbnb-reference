import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Listing } from "@/models/Listing";
import { Wishlist } from "@/models/Wishlist";
import { wishlistSchema } from "@/lib/schemas";
import { getWishlist } from "@/lib/queries";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    await connectDB();
    return ok({ listings: await getWishlist(session.userId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { listingId } = wishlistSchema.parse(await readJson(request));
    await connectDB();

    if (!(await Listing.exists({ _id: listingId }))) {
      return fail("Listing not found", 404);
    }

    const existing = await Wishlist.findOne({
      user: session.userId,
      listing: listingId,
    });
    if (existing) {
      await existing.deleteOne();
      return ok({ wishlisted: false });
    }

    await Wishlist.create({
      user: new Types.ObjectId(session.userId),
      listing: new Types.ObjectId(listingId),
    });
    return ok({ wishlisted: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
