// src/controller/review.js
import Review from "../models/review.js";
import Product from "../models/post.js";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

/** Recalculate product average rating and review count */
async function recalcProductRatings(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;
  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}

/** CREATE REVIEW (authenticated) */
export const createReview = async (req, res) => {
  try {
    const productId = req.params.product;
    const rating = Number(req.body.rating ?? req.body.rate ?? req.body.r);
    const comment = req.body.comment ?? req.body.text ?? "";

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating (1-5) is required" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const userId = req.user?.id || req.user?._id;
    let username = req.user?.name || req.body.username || "Anonymous";

    if ((!username || username === "Anonymous") && userId) {
      const dbUser = await User.findById(userId).select("name");
      if (dbUser) username = dbUser.name || username;
    }

    // handle file(s)
    let imageUrl = null;
    if (req.files?.image) {
      // support single file or array
      const file = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      // use tempFilePath (express-fileupload with useTempFiles: true)
      const tempPath = file.tempFilePath || file.tempFile;
      const uploadRes = await cloudinary.uploader.upload(tempPath, { folder: "product_reviews" });
      imageUrl = uploadRes.secure_url;
      try { if (tempPath) fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }
    } else if (req.body.image) {
      // client may have sent a pre-uploaded URL
      imageUrl = req.body.image;
    }

    const reviewDoc = new Review({
      product: productId,
      user: userId,
      username,
      rating,
      comment,
      image: imageUrl || null,
    });

    await reviewDoc.save();
    await recalcProductRatings(productId);

    return res.status(201).json({ success: true, message: "Review created", review: reviewDoc });
  } catch (err) {
    console.error("createReview error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/** GET REVIEWS (public, paginated) */
export const getReviewsByProduct = async (req, res) => {
  try {
    const productId = req.params.product;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments({ product: productId }),
    ]);

    return res.json({ success: true, reviews, total, page, count: reviews.length });
  } catch (err) {
    console.error("getReviewsByProduct error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/** DELETE REVIEW (owner or admin) */
export const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // if not admin, ensure owner
    if (req.user?.role !== "admin" && String(review.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Review.findByIdAndDelete(reviewId);
    await recalcProductRatings(review.product);

    return res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error("deleteReview error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
