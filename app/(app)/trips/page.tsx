import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getBookingsForUser } from "@/lib/queries";
import { BookingActions } from "@/components/BookingActions";
import { Avatar } from "@/components/Avatar";

export const metadata = { title: "Your trips" };

export default async function TripsPage() {
  const session = await getSession();
  await connectDB();
  const bookings = session
    ? await getBookingsForUser(session.userId, "guest")
    : [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Your trips</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bookings you have requested as a guest.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-medium text-slate-800">No trips yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Find a place you like and request to book it.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-block rounded-lg bg-[#ff385c] px-5 py-2 text-sm font-semibold text-white"
          >
            Explore stays
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row"
            >
              <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-40">
                {booking.listingImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={booking.listingImage}
                    alt={booking.listingTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No photo
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/listings/${booking.listingId}`}
                      className="font-semibold text-slate-900 hover:text-[#ff385c]"
                    >
                      {booking.listingTitle}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {booking.checkIn} → {booking.checkOut} · {booking.nights} nights ·{" "}
                      {booking.guests} guests
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Avatar name={booking.host.name} src={booking.host.avatarUrl} size="sm" />
                      Host: {booking.host.name}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                    {booking.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <p className="text-sm">
                    <span className="font-semibold">${booking.total}</span>{" "}
                    <span className="text-slate-500">
                      (${booking.subtotal} + ${booking.serviceFee} fee)
                    </span>
                  </p>
                  <BookingActions
                    bookingId={booking.id}
                    listingId={booking.listingId}
                    role="guest"
                    status={booking.status}
                    reviewId={booking.reviewId}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
