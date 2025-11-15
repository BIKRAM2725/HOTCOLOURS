// src/routes/review.js
import express from "express";
import fileUpload from "express-fileupload";
import { createReview, getReviewsByProduct, deleteReview } from "../controller/review.js";
import { requiredSignIn, isAdmin } from "../middlewares/Auth.js";


const router = express.Router();

// per-route fileUpload (safe even if you have app.use)
router.use(fileUpload({ useTempFiles: true }));

// create review (authenticated)
router.post("/:product/review", requiredSignIn, createReview);

// list reviews (public)
router.get("/:product", getReviewsByProduct);

// delete review (authenticated; controller enforces owner/admin)
router.delete("/delete/:id", requiredSignIn, deleteReview);

export default router;
