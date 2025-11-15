import mongoose from "mongoose";

// optional: allow 1–6 images
function arrayLimit(val) {
  return val.length >= 1 && val.length <= 6; // 1 to 6 images
}

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    description: { type: String, required: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    images: {
      type: [String],
      required: true,
      validate: [arrayLimit, "You must provide 1 to 6 images"],
    },

    isAvailable: {
      type: Boolean,
      default: true,
      required: true,
    },

    guest: { type: Number, required: true },

    price: {
      type: Number,
      required: true,
      min: 1,
      max: 1000000, // increased max price
    },

    facilities: {
      type: [String],
      
    },

    slug: { type: String, lowercase: true, unique: true },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
