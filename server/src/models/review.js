// src/models/review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    image: { type: String, default: null }, // Cloudinary secure_url
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
