import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/airbnb_ref";
const EXPECTED_DB = "airbnb_ref";

const NIGHT_MS = 86_400_000;
const SERVICE_FEE_RATE = 0.12;

function dayToMs(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Bad date: ${value}`);
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function nightsBetween(checkIn, checkOut) {
  const nights = (dayToMs(checkOut) - dayToMs(checkIn)) / NIGHT_MS;
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error(`Bad range: ${checkIn} -> ${checkOut}`);
  }
  return nights;
}

function totals(price, nights) {
  const subtotal = Math.round(price * nights * 100) / 100;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  return {
    subtotal,
    serviceFee,
    total: Math.round((subtotal + serviceFee) * 100) / 100,
  };
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    avatarUrl: String,
    bio: String,
  },
  { timestamps: true },
);
userSchema.index({ name: "text" });

const listingSchema = new mongoose.Schema(
  {
    host: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    propertyType: String,
    location: { city: String, country: String, address: String },
    pricePerNight: Number,
    capacity: Number,
    amenities: [String],
    images: [String],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
listingSchema.index({ "location.city": "text", "location.country": "text", title: "text" });
listingSchema.index({ host: 1, createdAt: -1 });
listingSchema.index({ propertyType: 1, pricePerNight: 1 });

const blockedDateSchema = new mongoose.Schema(
  { listing: mongoose.Schema.Types.ObjectId, date: String },
  { timestamps: { createdAt: true, updatedAt: false } },
);
blockedDateSchema.index({ listing: 1, date: 1 }, { unique: true });

const bookingSchema = new mongoose.Schema(
  {
    listing: mongoose.Schema.Types.ObjectId,
    host: mongoose.Schema.Types.ObjectId,
    guest: mongoose.Schema.Types.ObjectId,
    checkIn: String,
    checkOut: String,
    nights: Number,
    guests: Number,
    pricePerNight: Number,
    subtotal: Number,
    serviceFee: Number,
    total: Number,
    status: String,
  },
  { timestamps: true },
);
bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ host: 1, status: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, checkIn: 1 });

const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, unique: true },
    listing: mongoose.Schema.Types.ObjectId,
    author: mongoose.Schema.Types.ObjectId,
    rating: Number,
    comment: String,
  },
  { timestamps: true },
);
reviewSchema.index({ listing: 1, createdAt: -1 });

const wishlistSchema = new mongoose.Schema(
  { user: mongoose.Schema.Types.ObjectId, listing: mongoose.Schema.Types.ObjectId },
  { timestamps: { createdAt: true, updatedAt: false } },
);
wishlistSchema.index({ user: 1, listing: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Listing = mongoose.model("Listing", listingSchema);
const BlockedDate = mongoose.model("BlockedDate", blockedDateSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const Review = mongoose.model("Review", reviewSchema);
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

const people = [
  {
    name: "Maya Patel",
    email: "maya@example.com",
    bio: "Superhost in Goa. I love sharing my home with travelers from around the world.",
  },
  {
    name: "Alex Chen",
    email: "alex@example.com",
    bio: "Frequent traveler and occasional host. Coffee, coastlines, and good books.",
  },
  {
    name: "Diego Ruiz",
    email: "diego@example.com",
    bio: "Architect hosting a light-filled cabin in the hills.",
  },
  {
    name: "Priya Sharma",
    email: "priya@example.com",
    bio: "Designer always looking for a new city to explore.",
  },
  {
    name: "Sam Rivera",
    email: "sam@example.com",
    bio: "Digital nomad. I host when I am home and travel the rest of the year.",
  },
];

const places = [
  {
    host: 0,
    title: "Oceanview Loft in Anjuna",
    description:
      "Wake up to the sound of the waves in this bright loft steps from Anjuna beach. Private balcony, fully equipped kitchen, and a plunge pool shared with two other units.",
    propertyType: "apartment",
    location: { city: "Goa", country: "India", address: "Anjuna, North Goa" },
    pricePerNight: 120,
    capacity: 4,
    amenities: ["WiFi", "Pool", "Kitchen", "Air conditioning", "Free parking"],
    images: ["/images/stay-1.svg"],
  },
  {
    host: 0,
    title: "Palm Grove Villa",
    description:
      "A spacious four-bedroom villa with a lush garden, ideal for families. Chef's kitchen, outdoor dining area, and a short walk to the quietest beach in the north.",
    propertyType: "villa",
    location: { city: "Goa", country: "India", address: "Assagao, North Goa" },
    pricePerNight: 240,
    capacity: 8,
    amenities: ["WiFi", "Pool", "Kitchen", "Garden", "Free parking"],
    images: ["/images/stay-2.svg"],
  },
  {
    host: 2,
    title: "Hillside Cabin near Ooty",
    description:
      "A cozy timber cabin overlooking the Nilgiri hills. Wood-burning stove, panoramic deck, and hiking trails right outside the door.",
    propertyType: "cabin",
    location: { city: "Ooty", country: "India", address: "Coonoor Road" },
    pricePerNight: 95,
    capacity: 2,
    amenities: ["WiFi", "Fireplace", "Kitchen", "Mountain view"],
    images: ["/images/stay-3.svg"],
  },
  {
    host: 2,
    title: "Designer Studio in Barcelona",
    description:
      "A sunlit studio in the heart of Gràcia. Thoughtful interiors, a balcony for evening vermouth, and the metro three minutes away.",
    propertyType: "apartment",
    location: { city: "Barcelona", country: "Spain", address: "Gràcia" },
    pricePerNight: 150,
    capacity: 2,
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Balcony"],
    images: ["/images/stay-4.svg"],
  },
  {
    host: 4,
    title: "Garden Room in Ubud",
    description:
      "A private room surrounded by rice terraces. Breakfast included, bicycles available, and a yoga studio a five-minute walk away.",
    propertyType: "room",
    location: { city: "Ubud", country: "Indonesia", address: "Jalan Raya Sanggingan" },
    pricePerNight: 65,
    capacity: 2,
    amenities: ["WiFi", "Breakfast", "Pool", "Bicycles"],
    images: ["/images/stay-5.svg"],
  },
  {
    host: 1,
    title: "Lakeside House in Coimbatore",
    description:
      "A calm four-bedroom house with a private garden and a lake view. Great for a quiet weekend with friends or family.",
    propertyType: "house",
    location: { city: "Coimbatore", country: "India", address: "Singanallur" },
    pricePerNight: 180,
    capacity: 6,
    amenities: ["WiFi", "Kitchen", "Garden", "Free parking", "Lake view"],
    images: ["/images/stay-6.svg"],
  },
];

const blocked = [
  { listing: 0, date: "2026-12-24" },
  { listing: 0, date: "2026-12-25" },
  { listing: 2, date: "2027-01-01" },
];

const bookings = [
  {
    listing: 0,
    guest: 1,
    checkIn: "2026-12-10",
    checkOut: "2026-12-14",
    guests: 2,
    status: "confirmed",
  },
  {
    listing: 0,
    guest: 3,
    checkIn: "2027-01-05",
    checkOut: "2027-01-08",
    guests: 3,
    status: "pending",
  },
  {
    listing: 0,
    guest: 3,
    checkIn: "2026-10-02",
    checkOut: "2026-10-06",
    guests: 2,
    status: "completed",
  },
  {
    listing: 1,
    guest: 1,
    checkIn: "2026-11-02",
    checkOut: "2026-11-05",
    guests: 5,
    status: "cancelled",
  },
  {
    listing: 2,
    guest: 1,
    checkIn: "2026-09-12",
    checkOut: "2026-09-15",
    guests: 2,
    status: "completed",
  },
  {
    listing: 4,
    guest: 1,
    checkIn: "2026-08-10",
    checkOut: "2026-08-13",
    guests: 1,
    status: "completed",
  },
];

const reviews = [
  { booking: 2, listing: 0, author: 3, rating: 5, comment: "Beautiful loft and a wonderful host. The balcony sunsets were unforgettable." },
  { booking: 4, listing: 2, author: 1, rating: 4, comment: "Peaceful cabin with an incredible view. The stove kept us cozy every evening." },
];

const wishlists = [
  { user: 1, listing: 1 },
  { user: 1, listing: 4 },
  { user: 3, listing: 0 },
  { user: 3, listing: 3 },
];

async function main() {
  await mongoose.connect(URI);
  if (mongoose.connection.name !== EXPECTED_DB) {
    throw new Error(`Refusing to seed unexpected database: ${mongoose.connection.name}`);
  }

  await Promise.all([
    User.createIndexes(),
    Listing.createIndexes(),
    BlockedDate.createIndexes(),
    Booking.createIndexes(),
    Review.createIndexes(),
    Wishlist.createIndexes(),
  ]);

  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    BlockedDate.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Wishlist.deleteMany({}),
  ]);

  const password = await bcrypt.hash("password123", 12);
  const users = await User.create(
    people.map((person) => ({ ...person, password })),
  );
  const listings = await Listing.create(
    places.map((place) => ({ ...place, host: users[place.host]._id })),
  );
  await BlockedDate.create(
    blocked.map((item) => ({ ...item, listing: listings[item.listing]._id })),
  );

  const bookingDocs = bookings.map((booking) => {
    const listing = listings[booking.listing];
    const nights = nightsBetween(booking.checkIn, booking.checkOut);
    return {
      ...booking,
      listing: listing._id,
      host: listing.host,
      guest: users[booking.guest]._id,
      nights,
      pricePerNight: listing.pricePerNight,
      ...totals(listing.pricePerNight, nights),
    };
  });
  const createdBookings = await Booking.create(bookingDocs);

  await Review.create(
    reviews.map((review) => ({
      ...review,
      booking: createdBookings[review.booking]._id,
      listing: listings[review.listing]._id,
      author: users[review.author]._id,
    })),
  );

  await Wishlist.create(
    wishlists.map((item) => ({
      user: users[item.user]._id,
      listing: listings[item.listing]._id,
    })),
  );

  for (const review of reviews) {
    const listingId = listings[review.listing]._id;
    const stats = await Review.aggregate([
      { $match: { listing: listingId } },
      { $group: { _id: "$listing", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const stat = stats[0] ?? { avg: 0, count: 0 };
    await Listing.updateOne(
      { _id: listingId },
      {
        $set: {
          ratingAvg: Math.round(stat.avg * 10) / 10,
          ratingCount: stat.count,
        },
      },
    );
  }

  console.log(
    `Seeded ${users.length} users, ${listings.length} listings, ${blocked.length} blocked dates, ` +
      `${createdBookings.length} bookings, ${reviews.length} reviews, ${wishlists.length} wishlist items.`,
  );
  console.log("Demo logins: maya@example.com (host), alex@example.com (guest), priya@example.com, diego@example.com, sam@example.com — all password123");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
