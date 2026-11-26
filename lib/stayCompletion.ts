import { Types } from "mongoose";
import { Booking } from "@/models/Booking";
import { connectDB } from "@/lib/db";
import { dayToMs } from "@/lib/dates";
import { emitNotification } from "@/lib/notifications";
import type { BookingStatus } from "@/lib/types";

export const REVIEW_WINDOW_DAYS = 14;
const DAY_MS = 86_400_000;
const BATCH_LIMIT = 500;

type CompletionSource = {
  status: BookingStatus;
  completedAt?: Date | null;
  updatedAt?: Date | null;
  checkOut: string;
};

export type ReviewWindow = {
  status: "not_completed" | "open" | "closed";
  completedAt: Date | null;
  deadline: Date | null;
};

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getReviewWindow(
  booking: CompletionSource,
  now = new Date(),
): ReviewWindow {
  if (booking.status !== "completed") {
    return { status: "not_completed", completedAt: null, deadline: null };
  }
  const checkout = dayToMs(booking.checkOut);
  const completedAt =
    booking.completedAt ??
    booking.updatedAt ??
    (checkout === null ? null : new Date(checkout));
  if (!completedAt) return { status: "open", completedAt: null, deadline: null };
  const deadline = new Date(completedAt.getTime() + REVIEW_WINDOW_DAYS * DAY_MS);
  return {
    status: now.getTime() <= deadline.getTime() ? "open" : "closed",
    completedAt,
    deadline,
  };
}

export function isReviewOpen(booking: CompletionSource, now = new Date()) {
  return getReviewWindow(booking, now).status === "open";
}

export type CompletionReport = {
  scanned: number;
  completed: number;
  skipped: number;
  guestInvitations: number;
  hostNotices: number;
};

export async function runStayCompletion(
  now = new Date(),
): Promise<CompletionReport> {
  await connectDB();
  const report: CompletionReport = {
    scanned: 0,
    completed: 0,
    skipped: 0,
    guestInvitations: 0,
    hostNotices: 0,
  };

  const candidates = await Booking.find({
    status: "confirmed",
    checkOut: { $lt: todayKey(now) },
  })
    .select("listing host guest checkOut")
    .sort({ checkOut: 1 })
    .limit(BATCH_LIMIT)
    .lean();
  report.scanned = candidates.length;

  for (const candidate of candidates) {
    const completed = await Booking.findOneAndUpdate(
      { _id: candidate._id, status: "confirmed" },
      { $set: { status: "completed", completedAt: now } },
      { new: true },
    )
      .select("listing host guest")
      .lean();
    if (!completed) {
      report.skipped++;
      continue;
    }
    report.completed++;

    const bookingId = completed._id as Types.ObjectId;
    const listing = completed.listing as Types.ObjectId;
    const guestInvited = await emitNotification({
      recipient: completed.guest as Types.ObjectId,
      type: "review_invitation",
      booking: bookingId,
      listing,
      message: `Your stay has ended. Share a review within ${REVIEW_WINDOW_DAYS} days.`,
    });
    if (guestInvited) report.guestInvitations++;

    const hostNoticed = await emitNotification({
      recipient: completed.host as Types.ObjectId,
      type: "stay_completed",
      booking: bookingId,
      listing,
      message: `A stay ended and the guest was invited to review it.`,
    });
    if (hostNoticed) report.hostNotices++;
  }

  return report;
}
