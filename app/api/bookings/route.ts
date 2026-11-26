import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { bookingCreateSchema } from "@/lib/schemas";
import { createBooking } from "@/lib/bookingService";
import { getBookingsForUser, getBookingById } from "@/lib/queries";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") === "host" ? "host" : "guest";
    const rawStatus = searchParams.get("status");
    const status =
      rawStatus && (BOOKING_STATUSES as readonly string[]).includes(rawStatus)
        ? (rawStatus as BookingStatus)
        : undefined;

    await connectDB();
    return ok({ bookings: await getBookingsForUser(session.userId, role, status) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = bookingCreateSchema.parse(await readJson(request));
    await connectDB();

    const result = await createBooking(session.userId, body);
    if (!result.ok) return fail(result.error, result.status);

    return ok({ booking: await getBookingById(result.value.toString()) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

