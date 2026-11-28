# Stayly — Airbnb reference implementation

A reference implementation inspired by **Airbnb**: a stays marketplace where users can host, travel, or do both. Built with Next.js 16 App Router, React 19, Tailwind 4, TypeScript, MongoDB/Mongoose, bcryptjs, jose (JWT in an HTTP-only cookie), and zod.

## Features

- **Accounts** — register, login, logout, and session lookup; bcrypt password hashing and signed JWT cookies.
- **Listings** — create, read, update, delete; property type, location, nightly price, capacity, amenities, and images; only the host may edit or delete.
- **Photo gallery** — hosts upload multiple JPEG/PNG/WebP/GIF photos, reorder them (first photo is the cover), delete them, and get automatic file cleanup when a listing is deleted. Uploads are served from a CDN-cacheable origin route with immutable URLs and responsive optimization.
- **Search & discovery** — keyword and location search, type/price/guests/amenity filters, date availability filtering, sorting, and capped pagination.
- **Availability** — per-listing host-blocked dates and a public availability feed.
- **Bookings** — nightly subtotal + 12% service fee, overlap/date-range/capacity guards, pending → confirmed → completed/cancelled states, and host/guest confirm/cancel permissions.
- **Stay automation** — an idempotent cron job completes confirmed stays after checkout, invites guests to review, and notifies hosts.
- **Reviews** — 1–5 stars, only within a 14-day window after completion, one per booking, with atomic aggregate rating updates.
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
| `CRON_SECRET` | long random string | Bearer token required by the stay-completion cron endpoint. |
| `CDN_BASE_URL` | `https://cdn.example.com` | Optional CDN origin for uploaded photos; the CDN must proxy `/cdn/*` to the app. Unset means same-origin `/cdn/*` delivery. |
| `UPLOAD_DIR` | `/var/data/stayly-uploads` | Optional absolute path for uploaded files; defaults to `.data/uploads`. |

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
| DELETE | `/api/listings/[id]` | host | Delete listing, related data and stored photos |
| POST | `/api/listings/[id]/images` | host | Upload photos (multipart field `images`, repeatable) |
| PATCH | `/api/listings/[id]/images` | host | Reorder photos (`{ "order": [url, ...] }`) |
| DELETE | `/api/listings/[id]/images` | host | Delete one photo (`{ "url": "..." }`) |
| GET | `/cdn/listings/[listingId]/[imageId].[ext]` | – | Serve a stored photo with immutable CDN cache headers and ETag/304 support |
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
| GET, POST | `/api/cron/complete-stays` | `Bearer CRON_SECRET` | Complete stays whose checkout date has passed and emit notifications |

`vercel.json` schedules `GET /api/cron/complete-stays` hourly; Vercel Cron sends the configured `CRON_SECRET` as the bearer token. For a self-hosted deployment, call the endpoint from any scheduler or run `APP_URL=http://127.0.0.1:3206 CRON_SECRET=... npm run jobs:complete-stays`. Re-running the job is safe: the status guard completes each booking once and notification hooks are deduplicated per booking and recipient.

Guest review invitations and host completion notices are persisted in the `notifications` collection and passed to `deliverNotification` in `lib/notifications.ts`, the single swap point for an email/SMS provider.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Redirect to `/explore` or `/login` |
| `/login`, `/register` | Authentication |
| `/explore` | Searchable listing grid |
| `/listings/new` | Create a listing |
| `/listings/[id]` | Detail, availability, booking widget, reviews, host controls |
| `/listings/[id]/edit` | Host-only edit form and photo gallery manager (upload, reorder, delete) |
| `/trips` | Guest bookings |
| `/host` | Host listings and requests |
| `/wishlist` | Saved listings |

## Known limitations

- There is no payment integration; booking is a request that the host confirms, and totals are informational.
- Manual completion is still available, but scheduled completion is the default path; the cron endpoint must be invoked by a scheduler.
- Availability guards are enforced in application code; concurrent booking requests for the same nights are not wrapped in a MongoDB transaction (standalone MongoDB).
- Uploaded photos live in the local filesystem by default (`.data/uploads`); mount a shared volume or set `UPLOAD_DIR` for multi-instance deployments. `CDN_BASE_URL` rewrites delivered URLs to a CDN that must proxy `/cdn/*` to the app; no cloud storage provider is integrated and purges on delete must be handled by the CDN (immutable URLs make stale copies harmless). Placeholder images remain local SVGs.
- Text search uses escaped regexes rather than a dedicated search index.
- Email verification, password reset, messaging, and cancellation refunds are out of scope; stay notifications are in-app records plus a console delivery hook rather than delivered email.

## Verification

`npm run lint`, `npm run typecheck`, `npm run build`, and `npm run seed` all pass; the HTTP matrix covers auth, listing CRUD, filters/pagination, booking edge cases (overlap, invalid range, capacity, blocked dates, permissions), reviews, wishlists, photo upload/reorder/delete/CDN delivery and cleanup, and page status codes. Uploads are validated by MIME type, file signature, and size (8 MB), capped at 10 photos per listing, and only writable by the host.
