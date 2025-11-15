import express from "express";
import mongoose from "mongoose";
import Post from "../models/post.js";
import {
  createPostController,
  getPostController,
  getAllPostController,
  updatePostController,
  deletePostController,
  getRelatedPostsController,
  searchPostController

} from "../controller/post.js";

const router = express.Router();

// Get single post by slug or id
router.get("/get-post/:slug", getPostController);

// Create new post
router.post("/create-post", createPostController);

// Get all posts
router.get("/get-all-posts", getAllPostController);

// Update post
router.put("/update-post/:id", updatePostController);

// Delete post
router.delete("/delete-post/:id", deletePostController);

// Related posts (optional, can remove if not needed)
router.get("/related/:category/:excludeId", getRelatedPostsController);

router.get("/search", searchPostController);

router.get("/:catId", async (req, res) => {
  try {
    const catObjectId = new mongoose.Types.ObjectId(req.params.catId);
    const products = await Post.find({ category: catObjectId }).populate("category");
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


export default router;
