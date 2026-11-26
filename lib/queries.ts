import { Types } from "mongoose";
import { Listing } from "@/models/Listing";
import { Booking } from "@/models/Booking";
import { BlockedDate } from "@/models/BlockedDate";
import { Review } from "@/models/Review";
import { Wishlist } from "@/models/Wishlist";
import { nightsInRange } from "@/lib/dates";
import type {
  BookingDTO,
  BookingStatus,
  HostDTO,
  ListingDTO,
  Paginated,
  PropertyType,
  ReviewDTO,
} from "@/lib/types";

type LeanHost = { _id: Types.ObjectId; name: string; avatarUrl: string };

type LeanListing = {
  _id: Types.ObjectId;
  host: LeanHost | Types.ObjectId | null;
  title: string;
  description: string;
  propertyType: PropertyType;
  location: { city: string; country: string; address: string };
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
};

type LeanBooking = {
  _id: Types.ObjectId;
  listing: (LeanListing & { title: string; images: string[] }) | null;
  host: LeanHost | null;
  guest: LeanHost | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  status: BookingStatus;
  createdAt: Date;
};

type LeanReview = {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  author: LeanHost | null;
  rating: number;
  comment: string;
  createdAt: Date;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toHost(host: LeanHost | Types.ObjectId | null): HostDTO {
  if (host && typeof host === "object" && "name" in host) {
    return {
      id: host._id.toString(),
      name: host.name,
      avatarUrl: host.avatarUrl ?? "",
    };
  }
  return { id: "", name: "Unknown", avatarUrl: "" };
}

function toListingDTO(listing: LeanListing, wishlisted: boolean): ListingDTO {
  return {
    id: listing._id.toString(),
    host: toHost(listing.host),
    title: listing.title,
    description: listing.description,
    propertyType: listing.propertyType,
    location: {
      city: listing.location?.city ?? "",
      country: listing.location?.country ?? "",
      address: listing.location?.address ?? "",
    },
    pricePerNight: listing.pricePerNight,
    capacity: listing.capacity,
    amenities: listing.amenities ?? [],
    images: listing.images ?? [],
    ratingAvg: listing.ratingAvg ?? 0,
    ratingCount: listing.ratingCount ?? 0,
    wishlisted,
    createdAt: listing.createdAt.toISOString(),
  };
}

async function wishlistedIds(viewerId: string, ids: Types.ObjectId[]): Promise<Set<string>> {
  if (!viewerId || !Types.ObjectId.isValid(viewerId) || ids.length === 0) return new Set();
  const items = await Wishlist.find({ user: viewerId, listing: { $in: ids } })
    .select("listing")
    .lean();
  return new Set(items.map((item) => item.listing.toString()));
}

export type ListingQuery = {
  q?: string;
  location?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  sort?: "recommended" | "price-asc" | "price-desc" | "rating";
  page: number;
  limit: number;
};

export async function getListings(
  query: ListingQuery,
  viewerId = "",
): Promise<Paginated<ListingDTO>> {
  const filter: Record<string, unknown> = {};

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q.trim()), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { "location.city": regex },
      { "location.country": regex },
    ];
  }
  if (query.location) {
    const regex = new RegExp(escapeRegex(query.location.trim()), "i");
    filter.$or = [
      { "location.city": regex },
      { "location.country": regex },
      { "location.address": regex },
    ];
  }
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const range: Record<string, number> = {};
    if (query.minPrice !== undefined) range.$gte = query.minPrice;
    if (query.maxPrice !== undefined) range.$lte = query.maxPrice;
    filter.pricePerNight = range;
  }
  if (query.guests && query.guests > 0) filter.capacity = { $gte: query.guests };
  if (query.amenities && query.amenities.length > 0) {
    filter.amenities = { $all: query.amenities };
  }

  if (query.checkIn && query.checkOut) {
    const nights = nightsInRange(query.checkIn, query.checkOut);
    const unavailable = new Set<string>();
    const overlapping = await Booking.find({
      status: { $in: ["pending", "confirmed"] },
      checkIn: { $lt: query.checkOut },
      checkOut: { $gt: query.checkIn },
    })
      .select("listing")
      .lean();
    for (const booking of overlapping) unavailable.add(booking.listing.toString());
    if (nights.length > 0) {
      const blocked = await BlockedDate.find({ date: { $in: nights } })
        .select("listing")
        .lean();
      for (const item of blocked) unavailable.add(item.listing.toString());
    }
    if (unavailable.size > 0) {
      filter._id = { $nin: Array.from(unavailable).map((id) => new Types.ObjectId(id)) };
    }
  }

  const sort: Record<string, 1 | -1> =
    query.sort === "price-asc"
      ? { pricePerNight: 1 }
      : query.sort === "price-desc"
        ? { pricePerNight: -1 }
        : query.sort === "rating"
          ? { ratingAvg: -1, ratingCount: -1 }
          : { createdAt: -1 };

  const page = Math.max(1, query.page);
  const limit = Math.min(Math.max(1, query.limit), 24);
  const total = await Listing.countDocuments(filter);
  const docs = (await Listing.find(filter)
    .populate("host", "name avatarUrl")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()) as unknown as LeanListing[];

  const wished = await wishlistedIds(
    viewerId,
    docs.map((doc) => doc._id),
  );

  return {
    items: docs.map((doc) => toListingDTO(doc, wished.has(doc._id.toString()))),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getListingById(
  id: string,
  viewerId = "",
): Promise<ListingDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = (await Listing.findById(id)
    .populate("host", "name avatarUrl")
    .lean()) as unknown as LeanListing | null;
  if (!doc) return null;
  const wished = await wishlistedIds(viewerId, [doc._id]);
  return toListingDTO(doc, wished.has(doc._id.toString()));
}

export function toBookingDTO(booking: LeanBooking): BookingDTO {
  return {
    id: booking._id.toString(),
    listingId: booking.listing?._id.toString() ?? "",
    listingTitle: booking.listing?.title ?? "Removed listing",
    listingImage: booking.listing?.images?.[0] ?? "",
    host: toHost(booking.host),
    guest: toHost(booking.guest),
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    subtotal: booking.subtotal,
    serviceFee: booking.serviceFee,
    total: booking.total,
    guests: booking.guests,
    status: booking.status,
    reviewId: null,
    createdAt: booking.createdAt.toISOString(),
  };
}

export async function getBookingsForUser(
  userId: string,
  role: "guest" | "host",
  status?: BookingStatus,
): Promise<BookingDTO[]> {
  const filter: Record<string, unknown> = { [role]: userId };
  if (status) filter.status = status;
  const docs = (await Booking.find(filter)
    .populate("listing", "title images host")
    .populate("host", "name avatarUrl")
    .populate("guest", "name avatarUrl")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()) as unknown as LeanBooking[];

  const bookingIds = docs.map((doc) => doc._id);
  const reviews = bookingIds.length
    ? await Review.find({ booking: { $in: bookingIds } }).select("booking").lean()
    : [];
  const reviewed = new Map(reviews.map((review) => [review.booking.toString(), review._id.toString()]));

  return docs.map((doc) => ({
    ...toBookingDTO(doc),
    reviewId: reviewed.get(doc._id.toString()) ?? null,
  }));
}

export async function getBookingById(id: string): Promise<BookingDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = (await Booking.findById(id)
    .populate("listing", "title images host")
    .populate("host", "name avatarUrl")
    .populate("guest", "name avatarUrl")
    .lean()) as unknown as LeanBooking | null;
  if (!doc) return null;
  const review = await Review.findOne({ booking: doc._id }).select("_id").lean();
  return {
    ...toBookingDTO(doc),
    reviewId: review?._id.toString() ?? null,
  };
}

export async function getHostListings(userId: string): Promise<ListingDTO[]> {
  const docs = (await Listing.find({ host: userId })
    .populate("host", "name avatarUrl")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()) as unknown as LeanListing[];
  return docs.map((doc) => toListingDTO(doc, false));
}

export async function getListingReviews(listingId: string): Promise<ReviewDTO[]> {
  if (!Types.ObjectId.isValid(listingId)) return [];
  const docs = (await Review.find({ listing: listingId })
    .populate("author", "name avatarUrl")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()) as unknown as LeanReview[];

  return docs.map((doc) => ({
    id: doc._id.toString(),
    bookingId: doc.booking.toString(),
    author: toHost(doc.author),
    rating: doc.rating,
    comment: doc.comment,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function getWishlist(userId: string): Promise<ListingDTO[]> {
  const items = await Wishlist.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("listing")
    .lean();
  const ids = items.map((item) => item.listing);
  if (ids.length === 0) return [];
  const docs = (await Listing.find({ _id: { $in: ids } })
    .populate("host", "name avatarUrl")
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanListing[];
  return docs.map((doc) => toListingDTO(doc, true));
}
