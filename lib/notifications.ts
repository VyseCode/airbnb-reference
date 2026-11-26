import { Types } from "mongoose";
import { Notification, type NotificationType } from "@/models/Notification";

export type NotificationDTO = {
  id: string;
  recipientId: string;
  type: NotificationType;
  bookingId: string;
  listingId: string;
  message: string;
  createdAt: string;
};

export type NotificationInput = {
  recipient: Types.ObjectId;
  type: NotificationType;
  booking: Types.ObjectId;
  listing: Types.ObjectId;
  message: string;
};

export async function deliverNotification(
  notification: NotificationDTO,
): Promise<void> {
  console.info(
    `[notification] ${notification.type} -> ${notification.recipientId}: ${notification.message}`,
  );
}

export async function emitNotification(
  input: NotificationInput,
): Promise<boolean> {
  try {
    const result = await Notification.updateOne(
      { recipient: input.recipient, type: input.type, booking: input.booking },
      {
        $setOnInsert: {
          recipient: input.recipient,
          type: input.type,
          booking: input.booking,
          listing: input.listing,
          message: input.message,
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount === 0) return false;

    await deliverNotification({
      id: "",
      recipientId: input.recipient.toString(),
      type: input.type,
      bookingId: input.booking.toString(),
      listingId: input.listing.toString(),
      message: input.message,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return false;
    }
    throw error;
  }
}
