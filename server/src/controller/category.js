import Category from "../models/category.js";
import cloudinary from "../config/cloudinary.js";

// CREATE CATEGORY
export const createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name is required" });

    if (!req.files?.image)
      return res.status(400).json({ success: false, message: "Image is required" });

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
      folder: "categories",
    });

    const category = await new Category({
      name,
      image: result.secure_url,
      public_id: result.public_id,
    }).save();

    res.status(201).json({ success: true, message: "Category created successfully", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET ALL CATEGORIES
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// DELETE CATEGORY
export const deleteCategoryController = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Category not found" });

    if (category.public_id) {
      await cloudinary.uploader.destroy(category.public_id);
    }

    await category.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
