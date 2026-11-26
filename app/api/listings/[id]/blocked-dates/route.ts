import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { BlockedDate } from "@/models/BlockedDate";
import { Listing } from "@/models/Listing";
import { blockedDateSchema, objectIdSchema } from "@/lib/schemas";
import { z } from "zod";

const paramsSchema = z.object({ id: objectIdSchema });

export async function GET(
  _request: Request,
  context: RouteContext<"/api/listings/[id]/blocked-dates">,
) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    await connectDB();
    const dates = await BlockedDate.find({ listing: id })
      .select("date -_id")
      .sort({ date: 1 })
      .lean();
    return ok({ dates: dates.map((item) => item.date) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/listings/[id]/blocked-dates">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const { date } = blockedDateSchema.parse(await readJson(request));
    await connectDB();

    const listing = await Listing.findById(id).select("host");
    if (!listing) return fail("Listing not found", 404);
    if (listing.host.toString() !== session.userId) {
      return fail("Only the host can block dates", 403);
    }
    if (date < new Date().toISOString().slice(0, 10)) {
      return fail("Cannot block a date in the past", 400);
    }

    await BlockedDate.create({ listing: new Types.ObjectId(id), date });
    return ok({ date }, 201);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return fail("That date is already blocked", 409);
    }
    return handleError(error);
  }
}
