import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    image: {
      type: String, // Cloudinary URL
    },
    public_id: {
      type: String, // Cloudinary public_id for deletion
    },
  },
  { timestamps: true }
);

// Auto-generate slug
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

export default mongoose.model("Category", categorySchema);


