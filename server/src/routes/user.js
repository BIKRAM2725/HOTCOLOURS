
import express from "express";
import { registerController, loginController } from "../controller/user.js";
import { requiredSignIn, isAdmin } from "../middlewares/Auth.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);

// Protected user auth
router.get("/user-auth", requiredSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// Protected admin auth (must verify token first)
router.get("/admin-auth", requiredSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

export default router;
