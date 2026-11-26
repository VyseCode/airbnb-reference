import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Wishlist } from "@/models/Wishlist";
import { z } from "zod";

const paramsSchema = z.object({
  listingId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), "Invalid listing id"),
});

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/wishlist/[listingId]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { listingId } = paramsSchema.parse(await context.params);
    await connectDB();

    const result = await Wishlist.deleteOne({
      user: session.userId,
      listing: listingId,
    });
    if (result.deletedCount === 0) return fail("Listing is not on your wishlist", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
