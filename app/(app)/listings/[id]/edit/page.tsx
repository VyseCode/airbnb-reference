import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getListingById } from "@/lib/queries";
import { ListingForm } from "@/components/ListingForm";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  const session = await getSession();
  await connectDB();
  const listing = await getListingById(id, session?.userId ?? "");
  if (!listing || listing.host.id !== session?.userId) notFound();

  return <ListingForm initial={listing} />;
}
