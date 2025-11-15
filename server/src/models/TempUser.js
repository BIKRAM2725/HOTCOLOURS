// models/TempUser.js
import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  password: { type: String, required: true }, // hashed password
  otp: { type: String, required: true }, // hashed OTP
  otpExpiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// optional TTL: auto-delete after 1 hour (uncomment if desired)
// tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

export default mongoose.model("TempUser", tempUserSchema);
