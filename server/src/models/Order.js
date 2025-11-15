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

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
        quantity: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true },
    address: {
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
    },
    paymentMethod: { type: String, enum: ["COD", "Card"], default: "COD" },

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

    returnRefund: {
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

    // NEW fields for idempotent stock operations
    stockReduced: { type: Boolean, default: false },  // set true once stock is decreased on Delivered
    stockRestored: { type: Boolean, default: false }, // set true once stock restored for return collection
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
