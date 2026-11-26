import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getBookingsForUser, getHostListings } from "@/lib/queries";
import { BookingActions } from "@/components/BookingActions";
import { Avatar } from "@/components/Avatar";

export const metadata = { title: "Host dashboard" };

export default async function HostPage() {
  const session = await getSession();
  await connectDB();
  const [listings, bookings] = session
    ? await Promise.all([
        getHostListings(session.userId),
        getBookingsForUser(session.userId, "host"),
      ])
    : [[], []];

  const pending = bookings.filter((booking) => booking.status === "pending").length;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Host dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {listings.length} {listings.length === 1 ? "listing" : "listings"} · {pending}{" "}
            pending {pending === 1 ? "request" : "requests"}
          </p>
        </div>
        <Link
          href="/listings/new"
          className="rounded-lg bg-[#ff385c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e00b3d]"
        >
          + New listing
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Your listings</h2>
        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            You have not listed a place yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="h-28 bg-slate-100">
                  {listing.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="font-semibold text-slate-900 hover:text-[#ff385c]"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {listing.location.city} · ${listing.pricePerNight}/night
                  </p>
                  <div className="mt-3 flex gap-3 text-sm">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="font-semibold text-[#ff385c] hover:underline"
                    >
                      View
                    </Link>
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="text-slate-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Booking requests
        </h2>
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No booking requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Avatar name={booking.guest.name} src={booking.guest.avatarUrl} size="sm" />
                        {booking.guest.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/listings/${booking.listingId}`}
                        className="text-[#ff385c] hover:underline"
                      >
                        {booking.listingTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {booking.checkIn} → {booking.checkOut}
                    </td>
                    <td className="px-4 py-3">${booking.total}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <BookingActions
                        bookingId={booking.id}
                        listingId={booking.listingId}
                        role="host"
                        status={booking.status}
                        reviewId={booking.reviewId}
                        reviewDeadline={booking.reviewDeadline}
                        reviewWindowOpen={booking.reviewWindowOpen}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
