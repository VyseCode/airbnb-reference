import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IBlockedDate {
  _id: Types.ObjectId;
  listing: Types.ObjectId;
  date: string;
  createdAt: Date;
}

const blockedDateSchema = new Schema<IBlockedDate>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

blockedDateSchema.index({ listing: 1, date: 1 }, { unique: true });

export const BlockedDate: Model<IBlockedDate> =
  (models.BlockedDate as Model<IBlockedDate>) ||
  model<IBlockedDate>("BlockedDate", blockedDateSchema);
