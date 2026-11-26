# Stayly — Airbnb reference implementation

A reference implementation inspired by **Airbnb**: a stays marketplace where users can host, travel, or do both. Built with Next.js 16 App Router, React 19, Tailwind 4, TypeScript, MongoDB/Mongoose, bcryptjs, jose (JWT in an HTTP-only cookie), and zod.

## Features

- **Accounts** — register, login, logout, and session lookup; bcrypt password hashing and signed JWT cookies.
- **Listings** — create, read, update, delete; property type, location, nightly price, capacity, amenities, and images; only the host may edit or delete.
- **Search & discovery** — keyword and location search, type/price/guests/amenity filters, date availability filtering, sorting, and capped pagination.
- **Availability** — per-listing host-blocked dates and a public availability feed.
- **Bookings** — nightly subtotal + 12% service fee, overlap/date-range/capacity guards, pending → confirmed → completed/cancelled states, and host/guest confirm/cancel permissions.
- **Reviews** — 1–5 stars, only after a completed stay, one per booking, with atomic aggregate rating updates.
- **Wishlists** — save/unsave listings, one entry per user and listing.
- **Dashboards** — host listings and incoming booking requests; guest trips with status, breakdown, and review links.
- **Responsive UI** — grid, detail page with booking widget, loading/empty/error states.

## Setup

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

`npm run dev` starts on port 3000 by default; the reference port used for verification is **3206** (`npm run start -- -p 3206` after `npm run build`).

## Environment

| Variable | Example | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/airbnb_ref` | MongoDB connection; seed refuses to wipe any other database. |
| `JWT_SECRET` | long random string | Signs session tokens. |

## Seed

```bash
npm run seed
```

Re-runnable: creates indexes, then wipes and recreates only the `airbnb_ref` collections. Expected counts: 5 users, 6 listings, 3 blocked dates, 6 bookings (1 confirmed, 1 pending, 3 completed, 1 cancelled), 2 reviews, 4 wishlist items.

Demo accounts (all password `password123`):

| Email | Role |
| --- | --- |
| `maya@example.com` | Host of the Goa loft and villa |
| `diego@example.com` | Host of the cabin and Barcelona studio |
| `sam@example.com` | Host of the lakeside house |
| `alex@example.com` | Guest (also hosts the lakeside listing) |
| `priya@example.com` | Guest with a completed, already-reviewed stay |

## API

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create account, set session cookie |
| POST | `/api/auth/login` | – | Sign in |
| POST | `/api/auth/logout` | – | Clear session cookie |
| GET | `/api/auth/me` | – | Current user or null |
| GET | `/api/listings` | – | Search/filter/sort/paginate (`q`, `location`, `type`, `minPrice`, `maxPrice`, `guests`, `amenities`, `checkIn`, `checkOut`, `sort`, `page`, `limit`) |
| POST | `/api/listings` | user | Create listing |
| GET | `/api/listings/[id]` | – | Listing detail |
| PATCH | `/api/listings/[id]` | host | Update listing |
| DELETE | `/api/listings/[id]` | host | Delete listing and related data |
| GET | `/api/listings/[id]/availability` | – | Blocked dates and active booking ranges |
| GET | `/api/listings/[id]/blocked-dates` | – | Blocked dates |
| POST | `/api/listings/[id]/blocked-dates` | host | Block a date |
| DELETE | `/api/listings/[id]/blocked-dates/[date]` | host | Unblock a date |
| GET | `/api/listings/[id]/reviews` | – | Listing reviews |
| POST | `/api/listings/[id]/reviews` | guest | Review a completed booking (`bookingId`, `rating`, `comment`) |
| GET | `/api/bookings?role=guest\|host&status=` | user | Role-scoped bookings |
| POST | `/api/bookings` | guest | Request a booking (`listingId`, `checkIn`, `checkOut`, `guests`) |
| GET | `/api/bookings/[id]` | participant | Booking detail |
| POST | `/api/bookings/[id]` | participant | `confirm` (host), `cancel`, or `complete` |
| GET | `/api/wishlist` | user | Saved listings |
| POST | `/api/wishlist` | user | Toggle save (`listingId`) |
| DELETE | `/api/wishlist/[listingId]` | user | Remove saved listing |

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Redirect to `/explore` or `/login` |
| `/login`, `/register` | Authentication |
| `/explore` | Searchable listing grid |
| `/listings/new` | Create a listing |
| `/listings/[id]` | Detail, availability, booking widget, reviews, host controls |
| `/listings/[id]/edit` | Host-only edit form |
| `/trips` | Guest bookings |
| `/host` | Host listings and requests |
| `/wishlist` | Saved listings |

## Known limitations

- There is no payment integration; booking is a request that the host confirms, and totals are informational.
- Completion is explicit (`complete` action after checkout) rather than driven by a scheduled job.
- Availability guards are enforced in application code; concurrent booking requests for the same nights are not wrapped in a MongoDB transaction (standalone MongoDB).
- Images are local SVG placeholders; there is no image upload.
- Text search uses escaped regexes rather than a dedicated search index.
- Email verification, password reset, messaging, and cancellation refunds are out of scope.

## Verification

`npm run lint`, `npm run typecheck`, `npm run build`, and `npm run seed` all pass; the HTTP matrix covers 101 checks across auth, listing CRUD, filters/pagination, booking edge cases (overlap, invalid range, capacity, blocked dates, permissions), reviews, wishlists, and page status codes.
