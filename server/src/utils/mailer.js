// src/utils/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// simple wrapper
export async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || "App"}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    // optionally log info.messageId
    console.debug("Email sent:", info.messageId);
    return { success: true, info };
  } catch (err) {
    console.error("sendMail error:", err);
    return { success: false, error: err };
  }
}
