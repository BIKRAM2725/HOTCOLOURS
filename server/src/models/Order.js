// // src/models/Order.js
// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
//     items: [
//       {
//         product: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
//         quantity: { type: Number, required: true },
//         priceAtPurchase: { type: Number, required: true },
//       },
//     ],
//     total: { type: Number, required: true },
//     address: {
//       firstName: { type: String, required: true },
//       lastName: { type: String, required: true },
//       mobileNo: { type: String, required: true },
//       flatNo: { type: String, required: true },
//       localAddress: { type: String, required: true },
//       landmark: { type: String },
//       district: { type: String, required: true },
//       city: { type: String, required: true },
//       state: { type: String, required: true },
//       pincode: { type: String, required: true },
//     },
//     paymentMethod: { type: String, enum: ["COD", "Card"], default: "COD" },

//     // orderType and parent references (for future extension)
//     orderType: { type: String, enum: ["Sale", "ReturnCollection"], default: "Sale" },
//     parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
//     collectionOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },

//     status: {
//       type: String,
//       enum: [
//         "Pending",
//         "Pending Pickup",    // after admin accepts refund — awaiting collection
//         "Accepted",
//         "Confirmed",
//         "Shipped",
//         "Out for Delivery",
//         "Delivered",
//         "Collected",         // pickup completed
//         "Cancelled",
//       ],
//       default: "Pending",
//     },

//     // return/refund subdocument (REFUND only)
//     returnRefund: {
//       requestType: {
//         type: String,
//         enum: ["Refund"], // currently support only Refund
//         default: null,
//       },
//       reason: { type: String, default: "" },
//       upi: { type: String, default: "" },
//       status: {
//         type: String,
//         enum: ["Not Requested", "Requested", "Approved", "Pending Pickup", "Collected", "Rejected"],
//         default: "Not Requested",
//       },
//       requestDate: { type: Date },
//       acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
//       acceptedAt: { type: Date, default: null },
//       collectedAt: { type: Date, default: null },
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Order", orderSchema);

// src/models/Order.js
import mongoose from "mongoose";

const paymentVerificationSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["Email", "SMS", "Both"], default: "Both" },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    status: { type: String, enum: ["Pending", "Verified"], default: "Pending" },
    verifiedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const deliveryTokenSchema = new mongoose.Schema(
  {
    token: { type: String, default: null },           // short single-use token (string)
    expiresAt: { type: Date, default: null },         // optional expiry
    used: { type: Boolean, default: false },          // set true after token consumed
    createdAt: { type: Date, default: Date.now },     // created timestamp
  },
  { _id: false }
);

const returnRefundSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: ["Refund"],
      default: null,
    },
    reason: { type: String, default: "" },
    upi: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Not Requested", "Requested", "Approved", "Pending Pickup", "Collected", "Rejected"],
      default: "Not Requested",
    },
    requestDate: { type: Date },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    acceptedAt: { type: Date, default: null },
    collectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    quantity: { type: Number, required: true },
    priceAtPurchase: { type: Number, required: true },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNo: { type: String, required: true },
    flatNo: { type: String, required: true },
    localAddress: { type: String, required: true },
    landmark: { type: String },
    district: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    email: { type: String, default: null }, // optional email
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    items: { type: [itemSchema], default: [] },
    total: { type: Number, required: true },
    address: { type: addressSchema, required: true },
    paymentMethod: { type: String, enum: ["COD", "Card"], default: "COD" },

    // orderType and parent references (for future extension)
    orderType: { type: String, enum: ["Sale", "ReturnCollection"], default: "Sale" },
    parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    collectionOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },

    status: {
      type: String,
      enum: [
        "Pending",
        "Pending Pickup",
        "Accepted",
        "Confirmed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Collected",
        "Cancelled",
      ],
      default: "Pending",
    },

    // NEW: optional payment verification (OTP) subdocument — keeps backward compatibility
    paymentVerification: { type: paymentVerificationSchema, default: () => ({}) },

    // NEW: single-use delivery token (optional)
    deliveryToken: { type: deliveryTokenSchema, default: () => ({}) },

    // return/refund subdocument (REFUND only)
    returnRefund: { type: returnRefundSchema, default: () => ({}) },

    // you can add any other fields below if needed (stock flags, etc.)
    stockReduced: { type: Boolean, default: false },
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
