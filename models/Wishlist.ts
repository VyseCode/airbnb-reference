import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IWishlistItem {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  listing: Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlistItem>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

wishlistSchema.index({ user: 1, listing: 1 }, { unique: true });

export const Wishlist: Model<IWishlistItem> =
  (models.Wishlist as Model<IWishlistItem>) ||
  model<IWishlistItem>("Wishlist", wishlistSchema);
