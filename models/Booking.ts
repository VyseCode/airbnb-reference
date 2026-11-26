import { Schema, model, models, type Model, type Types } from "mongoose";

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface IBooking {
  _id: Types.ObjectId;
  listing: Types.ObjectId;
  host: Types.ObjectId;
  guest: Types.ObjectId;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  status: BookingStatus;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkIn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    checkOut: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    nights: { type: Number, required: true, min: 1 },
    guests: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    serviceFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "pending",
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ host: 1, status: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, checkIn: 1 });
bookingSchema.index({ listing: 1, status: 1 });
bookingSchema.index({ status: 1, checkOut: 1 });

export const Booking: Model<IBooking> =
  (models.Booking as Model<IBooking>) || model<IBooking>("Booking", bookingSchema);
