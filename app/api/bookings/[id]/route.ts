import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { bookingActionSchema, objectIdSchema } from "@/lib/schemas";
import { actOnBooking } from "@/lib/bookingService";
import { getBookingById } from "@/lib/queries";
import { z } from "zod";

const paramsSchema = z.object({ id: objectIdSchema });

export async function GET(
  _request: Request,
  context: RouteContext<"/api/bookings/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    await connectDB();
    const booking = await getBookingById(id);
    if (!booking) return fail("Booking not found", 404);
    if (booking.host.id !== session.userId && booking.guest.id !== session.userId) {
      return fail("You are not part of this booking", 403);
    }
    return ok({ booking });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/bookings/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = paramsSchema.parse(await context.params);
    const { action } = bookingActionSchema.parse(await readJson(request));
    await connectDB();

    const result = await actOnBooking(session.userId, id, action);
    if (!result.ok) return fail(result.error, result.status);

    return ok({ booking: await getBookingById(id) });
  } catch (error) {
    return handleError(error);
  }
}
