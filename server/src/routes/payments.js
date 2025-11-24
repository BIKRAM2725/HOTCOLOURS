import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import PaymentModel from "../models/Payment.js";
import OrderModel from "../models/Order.js";
import { requiredSignIn } from "../middlewares/Auth.js";

const router = express.Router();

// ensure env variables are present
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in environment. Payments will fail."
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/razorpay/create-order", requiredSignIn, async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      receipt = `rcpt_${Date.now()}`,
      metadata = {},
    } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: Number(amount),
      currency,
      receipt,
      payment_capture: 1,
      notes: { ...(metadata || {}) },
    };

    const rOrder = await razorpay.orders.create(options);

    const paymentDoc = new PaymentModel({
      user: req.user?.id || null,
      razorpayOrderId: rOrder.id,
      razorpayOrderObject: rOrder,
      amount: Number(amount),
      currency,
      receipt,
      notes: options.notes || {},
      status: "Created",
    });

    await paymentDoc.save();

    return res.json({
      success: true,
      razorpayOrder: rOrder,
      paymentRecord: paymentDoc,
    });
  } catch (err) {
    console.error("create-order err:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to create Razorpay order",
      });
  }
});

router.post("/razorpay/verify", requiredSignIn, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderMeta = {},
    } = req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment info" });
    }

    const paymentDoc = await PaymentModel.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated !== razorpay_signature) {
      if (paymentDoc) {
        paymentDoc.razorpayPaymentId = razorpay_payment_id;
        paymentDoc.razorpaySignature = razorpay_signature;
        paymentDoc.status = "Failed";
        paymentDoc.raw = { verified: false, reason: "signature_mismatch" };
        await paymentDoc.save();
      }
      console.warn("Razorpay signature mismatch", {
        generated,
        razorpay_signature,
      });
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    let createdOrder = null;


    if (orderMeta && orderMeta.items && Array.isArray(orderMeta.items)) {
      const items = orderMeta.items.map((it) => ({
        product: it.productId,
        quantity: it.quantity,
        priceAtPurchase: it.priceAtPurchase ?? it.price ?? 0,
      }));

      const newOrder = new OrderModel({
        user: req.user?.id || orderMeta.userId || null,
        items,
        total: orderMeta.total || 0,
        address: orderMeta.address,
        paymentMethod: orderMeta.paymentMethod || "Card",
        status: "Pending",
        returnRefund: { status: "Not Requested" },

        paymentVerification: {
          method: "Both", 
          status: "Verified",
          verifiedAt: new Date(),
          otp: null,
          otpExpires: null,
          attempts: 0,
        },

      });

      await newOrder.save();
      createdOrder = newOrder;
    }

    // Update or create Payment record
    if (paymentDoc) {
      paymentDoc.razorpayPaymentId = razorpay_payment_id;
      paymentDoc.razorpaySignature = razorpay_signature;
      paymentDoc.status = "Verified";
      paymentDoc.raw = { verified: true };
      if (createdOrder) paymentDoc.orderRef = createdOrder._id;
      await paymentDoc.save();
    } else {
      // fallback: create a Payment doc if one wasn't created earlier
      const fallback = new PaymentModel({
        user: req.user?.id || null,
        razorpayOrderId: razorpay_order_id,
        razorpayOrderObject: null,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: orderMeta.total ? Number(orderMeta.total) * 100 : 0,
        currency: orderMeta.currency || "INR",
        receipt: orderMeta.receipt || null,
        notes: orderMeta.notes || {},
        status: "Verified",
        orderRef: createdOrder ? createdOrder._id : null,
        raw: { verified: true },
      });
      await fallback.save();
    }

    // optionally notify user/admin here using your existing safeNotify helper

    return res.json({
      success: true,
      message: "Payment verified",
      order: createdOrder,
    });
  } catch (err) {
    console.error("verify err:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Verification failed" });
  }
});

export default router;
