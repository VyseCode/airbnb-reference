import { notFound } from "next/navigation";
import Link from "next/link";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getListingById } from "@/lib/queries";
import { Avatar } from "@/components/Avatar";
import { ListingActions } from "@/components/ListingActions";

export const metadata = { title: "Stay details" };

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  const session = await getSession();
  await connectDB();
  const listing = await getListingById(id, session?.userId ?? "");
  if (!listing) notFound();

  const isHost = session?.userId === listing.host.id;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/explore" className="text-sm text-[#ff385c] hover:underline">
            ← Back to explore
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{listing.title}</h1>
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
        </div>

        <aside>
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-2xl font-semibold text-slate-900">
              ${listing.pricePerNight} <span className="text-base font-normal text-slate-500">/ night</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Booking opens on this page once availability is configured.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
