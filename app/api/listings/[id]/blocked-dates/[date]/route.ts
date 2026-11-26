import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { BlockedDate } from "@/models/BlockedDate";
import { Listing } from "@/models/Listing";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().refine((value) => /^[0-9a-fA-F]{24}$/.test(value), "Invalid listing id"),
  date: z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Invalid date"),
});

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/listings/[id]/blocked-dates/[date]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id, date } = paramsSchema.parse(await context.params);
    await connectDB();

    const listing = await Listing.findById(id).select("host");
    if (!listing) return fail("Listing not found", 404);
    if (listing.host.toString() !== session.userId) {
      return fail("Only the host can unblock dates", 403);
    }

    const result = await BlockedDate.deleteOne({ listing: id, date });
    if (result.deletedCount === 0) return fail("Date was not blocked", 404);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
