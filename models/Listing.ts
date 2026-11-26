import { Schema, model, models, type Model, type Types } from "mongoose";

export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "room",
  "cabin",
  "hotel",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface IListing {
  _id: Types.ObjectId;
  host: Types.ObjectId;
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
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    propertyType: {
      type: String,
      enum: PROPERTY_TYPES,
      required: true,
      index: true,
    },
    location: {
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      address: { type: String, default: "" },
    },
    pricePerNight: { type: Number, required: true, min: 1, index: true },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

listingSchema.index({ "location.city": "text", "location.country": "text", title: "text" });
listingSchema.index({ host: 1, createdAt: -1 });
listingSchema.index({ propertyType: 1, pricePerNight: 1 });
listingSchema.index({ pricePerNight: 1, createdAt: -1 });

export const Listing: Model<IListing> =
  (models.Listing as Model<IListing>) ||
  model<IListing>("Listing", listingSchema);
