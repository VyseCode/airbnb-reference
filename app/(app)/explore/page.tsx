import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { ExploreFilters } from "@/components/ExploreFilters";
import { getListings, type ListingQuery } from "@/lib/queries";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/types";

export const metadata = { title: "Explore stays" };

type SearchParams = Record<string, string | string[] | undefined>;

function param(params: SearchParams, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function numberValue(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getSession();
  await connectDB();

  const type = param(params, "type");
  const sort = param(params, "sort");
  const query: ListingQuery = {
    q: param(params, "q") || undefined,
    location: param(params, "location") || undefined,
    propertyType:
      PROPERTY_TYPES.includes(type as PropertyType) ? (type as PropertyType) : undefined,
    minPrice: numberValue(param(params, "minPrice")),
    maxPrice: numberValue(param(params, "maxPrice")),
    guests: numberValue(param(params, "guests")),
    amenities: param(params, "amenities")
      ? param(params, "amenities")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
    checkIn: param(params, "checkIn") || undefined,
    checkOut: param(params, "checkOut") || undefined,
    sort:
      sort === "price-asc" || sort === "price-desc" || sort === "rating"
        ? sort
        : "recommended",
    page: numberValue(param(params, "page")) ?? 1,
    limit: 12,
  };

  const result = await getListings(query, session?.userId ?? "");

  function pageHref(page: number) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value) next.set(key, value);
    }
    next.set("page", String(page));
    return `/explore?${next.toString()}`;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Explore stays</h1>
          <p className="mt-1 text-sm text-slate-500">
            {result.total} {result.total === 1 ? "place" : "places"} available
          </p>
        </div>
        <Link
          href="/listings/new"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          + List your place
        </Link>
      </div>

      <ExploreFilters
        values={{
          q: param(params, "q"),
          location: param(params, "location"),
          type,
          minPrice: param(params, "minPrice"),
          maxPrice: param(params, "maxPrice"),
          guests: param(params, "guests"),
          checkIn: param(params, "checkIn"),
          checkOut: param(params, "checkOut"),
          sort: query.sort ?? "recommended",
          amenities: param(params, "amenities"),
        }}
      />

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-medium text-slate-800">No stays match these filters</p>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your dates, price range, or location.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              signedIn={Boolean(session)}
            />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3">
          {result.page > 1 && (
            <Link
              href={pageHref(result.page - 1)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-600">
            Page {result.page} of {result.totalPages}
          </span>
          {result.page < result.totalPages && (
            <Link
              href={pageHref(result.page + 1)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
