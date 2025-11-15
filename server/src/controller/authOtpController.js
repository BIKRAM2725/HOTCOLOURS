// src/controller/authOtpController.js
import TempUser from "../models/TempUser.js";
import userModel from "../models/user.js";
import bcrypt from "bcrypt";
import { sendMail } from "../utils/mailer.js";
import JWT from "jsonwebtoken";

const OTP_EXPIRE_MIN = 10;

// generate 6-digit OTP
const genOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtpController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    // prevent register if email exists
    const exist = await userModel.findOne({ email });
    if (exist)
      return res.status(400).json({ success: false, message: "User already exists" });

    // clear old OTP requests
    await TempUser.deleteMany({ email });

    // hash password
    const hashedPass = await bcrypt.hash(password, 10);

    // generate OTP
    const otp = genOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);

    await TempUser.create({
      name,
      email,
      password: hashedPass,
      otp: hashedOtp,
      otpExpiresAt,
    });

    // send mail
    const result = await sendMail({
      to: email,
      subject: "Your Hotcolours OTP",
      html: `<h2>Your OTP is <strong>${otp}</strong></h2><p>It expires in ${OTP_EXPIRE_MIN} minutes.</p>`,
    });

    if (!result.success) {
      console.error("nodemailer error:", result.error);
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("sendOtpController Error:", err);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

export const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    const temp = await TempUser.findOne({ email });
    if (!temp)
      return res.status(400).json({ success: false, message: "OTP expired or not requested" });

    // expired?
    if (temp.otpExpiresAt < new Date()) {
      await TempUser.deleteOne({ _id: temp._id });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // compare OTP
    const match = await bcrypt.compare(otp, temp.otp);
    if (!match) {
      temp.attempts = (temp.attempts || 0) + 1;
      await temp.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // create permanent user
    const user = await userModel.create({
      name: temp.name,
      email: temp.email,
      password: temp.password,
      role: "user",
    });

    await TempUser.deleteOne({ _id: temp._id });

    // auto-login token
    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("verifyOtpController Error:", err);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};

export const resendOtpController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const temp = await TempUser.findOne({ email });
    if (!temp)
      return res.status(400).json({ success: false, message: "No OTP request found" });

    // wait 30 sec to resend
    if (Date.now() - temp.createdAt < 30000)
      return res.status(429).json({ success: false, message: "Please wait before resending OTP" });

    const otp = genOtp();
    temp.otp = await bcrypt.hash(otp, 10);
    temp.otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);
    temp.createdAt = new Date();
    temp.attempts = 0;
    await temp.save();

    const result = await sendMail({
      to: email,
      subject: "Your New Hotcolours OTP",
      html: `<h2>Your new OTP is <strong>${otp}</strong></h2><p>It expires in ${OTP_EXPIRE_MIN} minutes.</p>`,
    });

    if (!result.success) {
      console.error("nodemailer error:", result.error);
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.status(200).json({ success: true, message: "OTP resent" });
  } catch (err) {
    console.error("resendOtpController Error:", err);
    res.status(500).json({ success: false, message: "Error resending OTP" });
  }
};
