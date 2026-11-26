import { Booking } from "@/models/Booking";
import { BlockedDate } from "@/models/BlockedDate";
import { connectDB } from "@/lib/db";
import { handleError, ok } from "@/lib/api";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().refine((value) => /^[0-9a-fA-F]{24}$/.test(value), "Invalid listing id"),
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/listings/[id]/availability">,
) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    await connectDB();

    const [blockedDates, bookings] = await Promise.all([
      BlockedDate.find({ listing: id })
        .select("date -_id")
        .sort({ date: 1 })
        .limit(200)
        .lean(),
      Booking.find({ listing: id, status: { $in: ["pending", "confirmed"] } })
        .select("checkIn checkOut -_id")
        .sort({ checkIn: 1 })
        .limit(200)
        .lean(),
    ]);

    return ok({
      dates: blockedDates.map((item) => item.date),
      ranges: bookings.map((booking) => ({
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
