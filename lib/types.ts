export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "room",
  "cabin",
  "hotel",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type HostDTO = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type ListingDTO = {
  id: string;
  host: HostDTO;
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
  wishlisted: boolean;
  createdAt: string;
};

export type BookingDTO = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  host: HostDTO;
  guest: HostDTO;
  checkIn: string;
  checkOut: string;
  nights: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  guests: number;
  status: BookingStatus;
  completedAt: string | null;
  reviewDeadline: string | null;
  reviewWindowOpen: boolean;
  reviewId: string | null;
  createdAt: string;
};

export type ReviewDTO = {
  id: string;
  bookingId: string;
  author: HostDTO;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
