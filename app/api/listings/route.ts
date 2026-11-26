import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Listing } from "@/models/Listing";
import { listingCreateSchema } from "@/lib/schemas";
import { getListingById, getListings, type ListingQuery } from "@/lib/queries";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/types";

const sortSchema = z.enum(["recommended", "price-asc", "price-desc", "rating"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSession();
    const type = searchParams.get("type");
    const sort = searchParams.get("sort");

    function numberParam(name: string): number | undefined {
      const raw = searchParams.get(name);
      if (raw === null || raw === "") return undefined;
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }

    const query: ListingQuery = {
      q: searchParams.get("q") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      propertyType:
        type && (PROPERTY_TYPES as readonly string[]).includes(type)
          ? (type as PropertyType)
          : undefined,
      minPrice: numberParam("minPrice"),
      maxPrice: numberParam("maxPrice"),
      guests: numberParam("guests"),
      amenities: searchParams.get("amenities")
        ? searchParams
            .get("amenities")!
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
      checkIn: searchParams.get("checkIn") ?? undefined,
      checkOut: searchParams.get("checkOut") ?? undefined,
      sort: sortSchema.safeParse(sort).success
        ? (sort as ListingQuery["sort"])
        : "recommended",
      page: numberParam("page") ?? 1,
      limit: numberParam("limit") ?? 12,
    };

    await connectDB();
    return ok(await getListings(query, session?.userId ?? ""));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = listingCreateSchema.parse(await readJson(request));
    await connectDB();

    const listing = await Listing.create({
      host: session.userId,
      title: body.title,
      description: body.description,
      propertyType: body.propertyType,
      location: {
        city: body.city,
        country: body.country,
        address: body.address ?? "",
      },
      pricePerNight: body.pricePerNight,
      capacity: body.capacity,
      amenities: body.amenities ?? [],
      images: body.images ?? [],
    });

    return ok({ listing: await getListingById(listing._id.toString(), session.userId) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
