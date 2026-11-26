import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getWishlist } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import Link from "next/link";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await getSession();
  await connectDB();
  const listings = session ? await getWishlist(session.userId) : [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Your wishlist</h1>
        <p className="mt-1 text-sm text-slate-500">
          {listings.length} saved {listings.length === 1 ? "place" : "places"}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-medium text-slate-800">Nothing saved yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Tap the heart on any listing to keep it here.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-block rounded-lg bg-[#ff385c] px-5 py-2 text-sm font-semibold text-white"
          >
            Explore stays
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              signedIn={Boolean(session)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
