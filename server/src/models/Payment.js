// src/models/Payment.js
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },

    // Razorpay order (server-created) info
    razorpayOrderId: { type: String, default: null },
    razorpayOrderObject: { type: Object, default: null }, // store raw object returned by razorpay.orders.create

    // Payment result (after checkout)
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    // amount, currency (values in paise and currency code)
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: "INR" },

    // business metadata (order meta / receipt / notes)
    receipt: { type: String, default: null },
    notes: { type: Object, default: {} },

    // status: Created, Paid, Failed, Verified
    status: {
      type: String,
      enum: ["Created", "Paid", "Verified", "Failed"],
      default: "Created",
    },

    // Link to your Order document (created after verification)
    orderRef: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },

    // store full verification response / any extra
    raw: { type: Object, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);
