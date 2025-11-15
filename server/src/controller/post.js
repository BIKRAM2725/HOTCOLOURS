import Post from "../models/post.js";
import cloudinary from "../config/cloudinary.js";
import Category from "../models/category.js";
import slugify from "slugify";

// Helper: Generate unique slug
const generateUniqueSlug = (title) => {
  return `${slugify(title, { lower: true })}-${Date.now()}`;
};

// CREATE POST
export const createPostController = async (req, res) => {
  try {
    const {
      title,
      description,
      isAvailable,
      category,
      guest,
      price,
      facilities,
    } = req.body;

    // Validation
    if (
      !title ||
      !description ||
      !category ||
      !guest ||
      !price ||
      !facilities
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (price < 1 || price > 1000000) {
      return res
        .status(400)
        .json({ message: "Price must be between 1 and 1,000,000" });
    }

    // Generate unique slug
    const slug = generateUniqueSlug(title);

    // Handle image uploads
    let files = req.files?.images;
    if (!files)
      return res.status(400).json({ message: "Please provide 1–6 images" });
    if (!Array.isArray(files)) files = [files];
    if (files.length < 1 || files.length > 6) {
      return res
        .status(400)
        .json({ message: "You can upload 1 to 6 images" });
    }

    const imageUrls = await Promise.all(
      files.map((file) =>
        cloudinary.uploader
          .upload(file.tempFilePath, { folder: "hotel_posts" })
          .then((result) => result.secure_url)
      )
    );

    // Create new post
    const newPost = new Post({
      title,
      description,
      category,
      images: imageUrls,
      isAvailable,
      guest,
      price,
      facilities: Array.isArray(facilities)
        ? facilities
        : JSON.parse(facilities),
      slug,
    });

    await newPost.save();
    res
      .status(201)
      .json({ success: true, message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error.message);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

//  GET ONE POST (works for both slug and id)
export const getPostController = async (req, res) => {
  try {
    const { slug } = req.params;
    let post;

    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's a valid ObjectId
      post = await Post.findById(slug);
    } else {
      // Otherwise treat as slug
      post = await Post.findOne({ slug });
    }

    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    res.status(200).json({ success: true, message: "Post fetched", post });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Something went wrong", error: error.message });
  }
};

// GET ALL POSTS
export const getAllPostController = async (req, res) => {
  try {
    const posts = await Post.find({});
    res
      .status(200)
      .json({ success: true, message: "All posts fetched", posts });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Something went wrong", error: error.message });
  }
};

// UPDATE POST
export const updatePostController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      isAvailable,
      category,
      guest,
      price,
      facilities,
    } = req.body;

    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    if (price && (price < 1 || price > 1000000)) {
      return res
        .status(400)
        .json({ message: "Price must be between 1 and 1,000,000" });
    }

    let files = req.files?.images;
    let uploadImage = post.images;

    if (files) {
      if (!Array.isArray(files)) files = [files];
      if (files.length < 1 || files.length > 6) {
        return res
          .status(400)
          .json({ message: "You can upload 1 to 6 images" });
      }

      // Delete old Cloudinary images
      await Promise.all(
        post.images.map((url) => {
          const publicId = url.split("/").slice(-1)[0].split(".")[0];
          return cloudinary.uploader.destroy(publicId);
        })
      );

      // Upload new images
      uploadImage = await Promise.all(
        files.map((file) =>
          cloudinary.uploader
            .upload(file.tempFilePath, { folder: "hotel_posts" })
            .then((result) => result.secure_url)
        )
      );
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        ...(title && { title, slug: generateUniqueSlug(title) }),
        ...(description && { description }),
        ...(category && { category }),
        ...(guest && { guest }),
        ...(price && { price }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(nearArea && {
          nearArea: Array.isArray(nearArea)
            ? nearArea
            : JSON.parse(nearArea),
        }),
        ...(facilities && {
          facilities: Array.isArray(facilities)
            ? facilities
            : JSON.parse(facilities),
        }),
        images: uploadImage,
      },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Something went wrong", error: error.message });
  }
};

// DELETE POST
export const deletePostController = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    await Promise.all(
      post.images.map((url) => {
        const publicId = url.split("/").slice(-1)[0].split(".")[0];
        return cloudinary.uploader.destroy(publicId);
      })
    );

    await Post.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Something went wrong", error: error.message });
  }
};

// GET RELATED POSTS BY CATEGORY
export const getRelatedPostsController = async (req, res) => {
  try {
    const { category, excludeId } = req.params;

    // Find other posts in the same category excluding current post
    const relatedPosts = await Post.find({
      category,
      _id: { $ne: excludeId }, 
    }).limit(4); 

    res.status(200).json({ success: true, message: "Related posts fetched", posts: relatedPosts });
  } catch (error) {
    console.error("Error fetching related posts:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};


// Search 


export const searchPostController = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    // Fetch all posts
    const posts = await Post.find().populate("category");

    // Fuzzy match (≥ 40% similarity)
    const results = posts.filter(post => {
      const combinedText = `${post.title} ${post.description} `.toLowerCase();
      const searchText = query.toLowerCase();
      const matchCount = searchText
        .split(" ")
        .filter(word => combinedText.includes(word)).length;

      const similarity = (matchCount / searchText.split(" ").length) * 100;
      return similarity >= 40; // 40% threshold
    });

    res.json({
      success: true,
      message: "Search results fetched",
      count: results.length,
      posts: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while searching posts",
      error: error.message,
    });
  }
};