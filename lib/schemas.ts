import { Types } from "mongoose";
import { z } from "zod";
import { PROPERTY_TYPES } from "@/lib/types";

export const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), "Invalid id");

export const daySchema = z
  .string()
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Use YYYY-MM-DD format");

export const imageSchema = z
  .string()
  .max(500)
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\/\S+$/.test(value),
    "Image must be a path or http(s) URL",
  );

export const listingCreateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(3000),
  propertyType: z.enum(PROPERTY_TYPES),
  city: z.string().trim().min(1, "City is required").max(80),
  country: z.string().trim().min(1, "Country is required").max(80),
  address: z.string().trim().max(200).optional().default(""),
  pricePerNight: z.number().int().min(1).max(10000),
  capacity: z.number().int().min(1).max(20),
  amenities: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  images: z.array(imageSchema).max(10).optional().default([]),
});

export const listingUpdateSchema = listingCreateSchema.partial();

export const bookingCreateSchema = z.object({
  listingId: objectIdSchema,
  checkIn: daySchema,
  checkOut: daySchema,
  guests: z.number().int().min(1, "At least one guest is required").max(20),
});

export const bookingActionSchema = z.object({
  action: z.enum(["confirm", "cancel"]),
});

export const reviewCreateSchema = z.object({
  bookingId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Tell us a little about your stay").max(1500),
});

export const blockedDateSchema = z.object({
  date: daySchema,
});

export const wishlistSchema = z.object({
  listingId: objectIdSchema,
});
