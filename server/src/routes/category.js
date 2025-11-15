import express from "express";
import { createCategoryController, getAllCategories, deleteCategoryController } from "../controller/category.js";
import { requiredSignIn, isAdmin } from "../middlewares/Auth.js";

const router = express.Router();

// Create category
router.post("/create-category", requiredSignIn, isAdmin, createCategoryController);

// Get all categories
router.get("/get-category", getAllCategories);

// Delete category
router.delete("/delete-category/:id", requiredSignIn, isAdmin, deleteCategoryController);

export default router;
