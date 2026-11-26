import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import type { ListingDTO } from "@/lib/types";

export function ListingCard({ listing }: { listing: ListingDTO }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {listing.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            No photo yet
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
          {listing.propertyType}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-900">{listing.title}</h3>
          {listing.ratingCount > 0 && (
            <span className="shrink-0 text-sm font-medium text-slate-700">
              ★ {listing.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-slate-500">
          {listing.location.city}, {listing.location.country}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Up to {listing.capacity} guests · {listing.amenities.length} amenities
        </p>
        <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
          <p className="text-sm text-slate-900">
            <span className="font-semibold">${listing.pricePerNight}</span> / night
          </p>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Avatar name={listing.host.name} src={listing.host.avatarUrl} size="sm" />
            {listing.host.name}
          </span>
        </div>
      </div>
    </Link>
  );
}
