// index.js (replace the whole file with this)
import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";


import { ConnectToDb } from "./src/config/db.js";

// route imports (OK to import here)
import authRouters from "./src/routes/user.js";
import postRoutes from "./src/routes/post.js";
import postCategory from "./src/routes/category.js";
import cartRoutes from "./src/routes/Cart.js";
import orderRoutes from "./src/routes/Order.js";
import reviewRoutes from "./src/routes/review.js"; // safe to import

import paymentsRouter from "./src/routes/payments.js";







dotenv.config(); // load .env

// connect DB before starting app (optional but convenient)
ConnectToDb();

// create app BEFORE using it
const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// file upload middleware (express-fileupload)
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
  })
);

// basic root
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => res.send("Welcome to API Server"));

// mount routes AFTER app is created
app.use("/api/auth", authRouters);
app.use("/api/post", postRoutes);
app.use("/api/category", postCategory);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/review", reviewRoutes); // <-- review mounted here
app.use("/api/payments", paymentsRouter);



// global error handler (optional)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
