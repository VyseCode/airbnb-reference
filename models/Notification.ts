import { Schema, model, models, type Model, type Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "review_invitation",
  "stay_completed",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  booking: Types.ObjectId;
  listing: Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    message: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

notificationSchema.index(
  { recipient: 1, type: 1, booking: 1 },
  { unique: true },
);
notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  (models.Notification as Model<INotification>) ||
  model<INotification>("Notification", notificationSchema);
