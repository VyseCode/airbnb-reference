import { notFound } from "next/navigation";
import Link from "next/link";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getListingById, getListingReviews } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { ListingActions } from "@/components/ListingActions";
import { BookingWidget } from "@/components/BookingWidget";
import { BlockedDatesManager } from "@/components/BlockedDatesManager";
import { BlockedDate } from "@/models/BlockedDate";
import { Booking } from "@/models/Booking";
import { Review } from "@/models/Review";
import { isReviewOpen } from "@/lib/stayCompletion";
import { ReviewForm } from "@/components/ReviewForm";
import { WishlistButton } from "@/components/WishlistButton";

export const metadata = { title: "Stay details" };

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!Types.ObjectId.isValid(id)) notFound();

  const session = await getSession();
  await connectDB();
  const [listing, blockedDates, reviews] = await Promise.all([
    getListingById(id, session?.userId ?? ""),
    BlockedDate.find({ listing: id })
      .select("date -_id")
      .sort({ date: 1 })
      .limit(200)
      .lean(),
    getListingReviews(id),
  ]);
  if (!listing) notFound();

  const isHost = session?.userId === listing.host.id;
  const reviewId = typeof query.review === "string" ? query.review : "";
  const reviewBooking =
    session && Types.ObjectId.isValid(reviewId)
      ? await Booking.findOne({
          _id: reviewId,
          listing: id,
          guest: session.userId,
          status: "completed",
        })
          .select("_id completedAt updatedAt checkOut")
          .lean()
      : null;
  const canReview =
    Boolean(reviewBooking) &&
    isReviewOpen({
      status: "completed",
      completedAt: reviewBooking?.completedAt,
      updatedAt: reviewBooking?.updatedAt,
      checkOut: reviewBooking?.checkOut ?? "",
    }) &&
    !(await Review.exists({ booking: reviewBooking!._id }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/explore" className="text-sm text-[#ff385c] hover:underline">
            ← Back to explore
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-slate-900">{listing.title}</h1>
            <WishlistButton
              listingId={listing.id}
              initial={listing.wishlisted}
              signedIn={Boolean(session)}
            />
          </div>
          <p className="mt-1 text-slate-500">
            {listing.location.address
              ? `${listing.location.address}, `
              : ""}
            {listing.location.city}, {listing.location.country}
          </p>
        </div>
        {isHost && <ListingActions listingId={listing.id} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {listing.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="aspect-[16/10] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-slate-400">
                No photo yet
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <Avatar name={listing.host.name} src={listing.host.avatarUrl} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">Hosted by {listing.host.name}</p>
                <p className="text-sm text-slate-500">
                  {listing.ratingCount > 0
                    ? `★ ${listing.ratingAvg.toFixed(1)} · ${listing.ratingCount} reviews`
                    : "New listing"}
                </p>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700">
              {listing.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Property type</p>
                <p className="text-sm capitalize text-slate-600">{listing.propertyType}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Capacity</p>
                <p className="text-sm text-slate-600">
                  Up to {listing.capacity} guests
                </p>
              </div>
            </div>

            {listing.amenities.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold text-slate-900">Amenities</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {canReview && (
            <ReviewForm listingId={listing.id} bookingId={reviewBooking!._id.toString()} />
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No reviews yet. Reviews appear after a stay is completed.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <Avatar name={review.author.name} src={review.author.avatarUrl} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {review.author.name}{" "}
                        <span className="ml-1 text-[#ff385c]">{"★".repeat(review.rating)}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="sticky top-20">
            <p className="mb-3 text-2xl font-semibold text-slate-900">
              ${listing.pricePerNight}{" "}
              <span className="text-base font-normal text-slate-500">/ night</span>
            </p>
            <BookingWidget
              listingId={listing.id}
              pricePerNight={listing.pricePerNight}
              capacity={listing.capacity}
              isHost={isHost}
              signedIn={Boolean(session)}
            />
          </div>
          {isHost && (
            <BlockedDatesManager
              listingId={listing.id}
              initialDates={blockedDates.map((item) => item.date)}
            />
          )}
        </aside>
      </div>
    </section>
  );
}
