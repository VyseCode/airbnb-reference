import { Types } from "mongoose";
import { Booking } from "@/models/Booking";
import { BlockedDate } from "@/models/BlockedDate";
import { Listing } from "@/models/Listing";
import { bookingTotals, nightsBetween, nightsInRange } from "@/lib/dates";
import type { BookingStatus } from "@/lib/types";

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; status: number };

export type CreateBookingInput = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
): Promise<ServiceResult<Types.ObjectId>> {
  const listing = await Listing.findById(input.listingId).select(
    "host capacity pricePerNight",
  );
  if (!listing) return { ok: false, error: "Listing not found", status: 404 };
  if (listing.host.toString() === userId) {
    return { ok: false, error: "You cannot book your own listing", status: 403 };
  }
  if (input.guests > listing.capacity) {
    return {
      ok: false,
      error: `This listing accommodates only ${listing.capacity} guests`,
      status: 400,
    };
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights === null) {
    return {
      ok: false,
      error: "Check-out must be at least one night after check-in",
      status: 400,
    };
  }
  if (nights > 30) {
    return { ok: false, error: "Stays are limited to 30 nights", status: 400 };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (input.checkIn < today) {
    return { ok: false, error: "Check-in cannot be in the past", status: 400 };
  }

  const blocked = await BlockedDate.countDocuments({
    listing: listing._id,
    date: { $in: nightsInRange(input.checkIn, input.checkOut) },
  });
  if (blocked > 0) {
    return {
      ok: false,
      error: "Some of those dates are blocked by the host",
      status: 409,
    };
  }

  const overlap = await Booking.findOne({
    listing: listing._id,
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: input.checkOut },
    checkOut: { $gt: input.checkIn },
  })
    .select("_id")
    .lean();
  if (overlap) {
    return {
      ok: false,
      error: "Those dates overlap an existing booking",
      status: 409,
    };
  }

  const amounts = bookingTotals(listing.pricePerNight, nights);
  const booking = await Booking.create({
    listing: listing._id,
    host: listing.host,
    guest: new Types.ObjectId(userId),
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    guests: input.guests,
    pricePerNight: listing.pricePerNight,
    ...amounts,
    status: "pending",
  });

  return { ok: true, value: booking._id };
}

export async function actOnBooking(
  userId: string,
  bookingId: string,
  action: "confirm" | "cancel" | "complete",
): Promise<ServiceResult<BookingStatus>> {
  const booking = await Booking.findById(bookingId);
  if (!booking) return { ok: false, error: "Booking not found", status: 404 };

  const isHost = booking.host.toString() === userId;
  const isGuest = booking.guest.toString() === userId;
  if (!isHost && !isGuest) {
    return { ok: false, error: "You are not part of this booking", status: 403 };
  }

  if (action === "confirm") {
    if (!isHost) {
      return { ok: false, error: "Only the host can confirm a booking", status: 403 };
    }
    if (booking.status !== "pending") {
      return { ok: false, error: "Only pending bookings can be confirmed", status: 409 };
    }
    booking.status = "confirmed";
  } else if (action === "cancel") {
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return { ok: false, error: "This booking can no longer be cancelled", status: 409 };
    }
    booking.status = "cancelled";
  } else {
    if (booking.checkOut >= new Date().toISOString().slice(0, 10)) {
      return { ok: false, error: "The stay has not ended yet", status: 400 };
    }
    if (booking.status !== "confirmed") {
      return { ok: false, error: "Only confirmed stays can be completed", status: 409 };
    }
    booking.status = "completed";
    booking.completedAt = new Date();
  }

  await booking.save();
  return { ok: true, value: booking.status };
}
