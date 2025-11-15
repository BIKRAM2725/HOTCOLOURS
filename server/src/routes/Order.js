// import express from "express";
// import mongoose from "mongoose";
// import Order from "../models/Order.js";
// import Product from "../models/post.js";
// import { requiredSignIn, isAdmin } from "../middlewares/Auth.js";
// import { sendMail } from "../utils/mailer.js";
// import { sendSms } from "../utils/sms.js";

// const router = express.Router();

// /* ---------------------- Helpers ---------------------- */

// function generateOtp() {
//   return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
// }

// async function safeNotify({ mailTo, mailSubject, mailHtml, mailText, smsTo, smsBody }) {
//   try {
//     if (mailTo) await sendMail({ to: mailTo, subject: mailSubject, html: mailHtml, text: mailText });
//   } catch (err) {
//     console.warn("safeNotify - mail error:", err?.message || err);
//   }

//   try {
//     if (smsTo) await sendSms({ to: smsTo, body: smsBody });
//   } catch (err) {
//     console.warn("safeNotify - sms error:", err?.message || err);
//   }
// }

// /* Format items for email/plain text - shows title/name, qty, unit price and line total */
// function formatItemsHtml(items = []) {
//   if (!Array.isArray(items) || items.length === 0) return "<p>No items</p>";
//   const rows = items
//     .map((it) => {
//       const prod = it.product || {};
//       const title = prod.title || prod.name || "Product";
//       const qty = it.quantity || 0;
//       const price = it.priceAtPurchase ?? prod.price ?? 0;
//       const lineTotal = price * qty;
//       return `<tr>
//       <td style="padding:6px 12px;border-bottom:1px solid #eee">${title}</td>
//       <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
//       <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${price}</td>
//       <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${lineTotal}</td>
//     </tr>`;
//     })
//     .join("");
//   return `
//     <table style="width:100%;border-collapse:collapse;margin-top:6px">
//       <thead><tr>
//         <th style="text-align:left;padding:6px 12px;border-bottom:1px solid #ddd">Product</th>
//         <th style="text-align:center;padding:6px 12px;border-bottom:1px solid #ddd">Qty</th>
//         <th style="text-align:right;padding:6px 12px;border-bottom:1px solid #ddd">Price</th>
//         <th style="text-align:right;padding:6px 12px;border-bottom:1px solid #ddd">Line</th>
//       </tr></thead>
//       <tbody>${rows}</tbody>
//     </table>
//   `;
// }
// function formatItemsText(items = []) {
//   if (!Array.isArray(items) || items.length === 0) return "No items";
//   return items
//     .map((it) => {
//       const prod = it.product || {};
//       const title = prod.title || prod.name || "Product";
//       const qty = it.quantity || 0;
//       const price = it.priceAtPurchase ?? prod.price ?? 0;
//       const lineTotal = price * qty;
//       return `${title} — Qty: ${qty} — ₹${price} — Line: ₹${lineTotal}`;
//     })
//     .join("\n");
// }

// function otpMessageText(otp, minutes = 10) {
//   return `Your verification code is ${otp}. It expires in ${minutes} minutes. Do not share this code with anyone.`;
// }
// function otpMessageHtml(otp, minutes = 10) {
//   return `<p>Your verification code is <strong>${otp}</strong>. It expires in ${minutes} minutes.</p><p>Do not share this code with anyone.</p>`;
// }

// /* ---------------------- Routes ---------------------- */

// /**
//  * Create a new order (authenticated)
//  * POST /api/orders/create
//  * - generates OTP for all orders (used later for delivery verification)
//  */
// router.post("/create", requiredSignIn, async (req, res) => {
//   try {
//     const { items, address, paymentMethod, userId: bodyUserId } = req.body;
//     const userId = bodyUserId || req.user?.id || req.user?._id;
//     if (!userId || !items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ success: false, message: "Missing required fields" });
//     }

//     const orderItems = await Promise.all(
//       items.map(async (item) => {
//         const product = await Product.findById(item.productId);
//         if (!product) throw new Error(`Product not found: ${item.productId}`);
//         return {
//           product: product._id,
//           quantity: item.quantity,
//           priceAtPurchase: product.price ?? 0,
//         };
//       })
//     );

//     const total = orderItems.reduce((acc, it) => acc + it.priceAtPurchase * it.quantity, 0);

//     const newOrder = new Order({
//       user: userId,
//       items: orderItems,
//       total,
//       address,
//       paymentMethod: paymentMethod || "COD",
//       status: "Pending",
//       returnRefund: { status: "Not Requested" },
//     });

//     // ALWAYS generate OTP (for all orders) to be used when marking Delivered by non-admins
//     const otp = generateOtp();
//     const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
//     newOrder.paymentVerification = {
//       method: "Both",
//       otp,
//       otpExpires,
//       status: "Pending",
//     };

//     await newOrder.save();
//     await newOrder.populate("items.product", "title name images price");
//     await newOrder.populate("user", "name email");

//     // Build safe response (remove OTP fields)
//     const safeOrder = newOrder.toObject();
//     if (safeOrder.paymentVerification) {
//       delete safeOrder.paymentVerification.otp;
//       delete safeOrder.paymentVerification.otpExpires;
//     }

//     // Notifications (non-blocking): send OTP to user + notify admin
//     (async () => {
//       try {
//         const itemsHtml = formatItemsHtml(newOrder.items);
//         const itemsText = formatItemsText(newOrder.items);

//         // Admin notify
//         if (process.env.ADMIN_EMAIL || process.env.ADMIN_PHONE) {
//           const subject = `[${process.env.APP_NAME || "App"}] New order placed (${String(newOrder._id).slice(-6)})`;
//           const html = `<p>New order placed.</p><p>Order ID: <strong>${newOrder._id}</strong></p>${itemsHtml}<p><strong>Total:</strong> ₹${newOrder.total}</p>`;
//           const sms = `${process.env.APP_NAME || "App"}: New order ${String(newOrder._id).slice(-6)} placed. Total ₹${newOrder.total}.`;
//           await safeNotify({
//             mailTo: process.env.ADMIN_EMAIL,
//             mailSubject: subject,
//             mailHtml: html,
//             mailText: `${subject}\n\n${itemsText}\n\nTotal: ₹${newOrder.total}`,
//             smsTo: process.env.ADMIN_PHONE,
//             smsBody: sms,
//           });
//         }

//         // Send OTP to user via email and SMS
//         const userEmail = newOrder.user?.email || newOrder.address?.email;
//         const userPhone = newOrder.address?.mobileNo;
//         if (userEmail || userPhone) {
//           const subject = `[${process.env.APP_NAME || "App"}] Verify for order ${String(newOrder._id).slice(-6)}`;
//           const html = `<p>Thanks — your order <strong>${newOrder._id}</strong> has been placed. Use the code below to confirm delivery when completing the order.</p>${itemsHtml}${otpMessageHtml(otp, 10)}<p><strong>Total:</strong> ₹${newOrder.total}</p>`;
//           const text = `Order ${newOrder._id} placed. ${itemsText}\n\n${otpMessageText(otp, 10)}\n\nTotal: ₹${newOrder.total}`;
//           const smsBody = `${process.env.APP_NAME || "App"}: Order ${String(newOrder._id).slice(-6)} placed. ${otpMessageText(otp, 10)}`;
//           await safeNotify({
//             mailTo: userEmail,
//             mailSubject: subject,
//             mailHtml: html,
//             mailText: text,
//             smsTo: userPhone,
//             smsBody,
//           });
//         }
//       } catch (err) {
//         console.warn("create notifications err:", err);
//       }
//     })();

//     res.json({ success: true, message: "Order created", order: safeOrder });
//   } catch (err) {
//     console.error("POST /create order error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Public: get public-safe order by id (no auth)
//  * GET /api/orders/public/:id
//  *
//  * Returns a safe version of the order for public tracking pages:
//  * - populates items.product (title/images/price)
//  * - populates user (name,email) if available
//  * - removes OTP fields from paymentVerification
//  */
// router.get("/public/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ success: false, message: "Invalid order id" });
//     }

//     const order = await Order.findById(id)
//       .populate("items.product", "title name images price")
//       .populate("user", "name email");

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     // Build safe copy (do not include OTPs)
//     const safe = order.toObject();
//     if (safe.paymentVerification) {
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     return res.json({ success: true, order: safe });
//   } catch (err) {
//     console.error("GET /public/:id error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Get orders for a specific user (authenticated).
//  * GET /api/orders/user/:userId
//  */
// router.get("/user/:userId", requiredSignIn, async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const requestingUserId = req.user?.id || req.user?._id;
//     if (!requestingUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

//     if (String(requestingUserId) !== String(userId) && req.user?.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Forbidden" });
//     }

//     const orders = await Order.find({ user: userId })
//       .populate("items.product", "title name images price")
//       .populate("user", "name email");

//     // Remove OTP details from returned orders
//     const safe = orders.map((o) => {
//       const obj = o.toObject();
//       if (obj.paymentVerification) {
//         delete obj.paymentVerification.otp;
//         delete obj.paymentVerification.otpExpires;
//       }
//       return obj;
//     });

//     res.json({ success: true, orders: safe });
//   } catch (err) {
//     console.error("GET /user/:userId error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Cancel order (owner or admin) - allowed if Pending or Accepted
//  */
// router.put("/cancel/:orderId", requiredSignIn, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const order = await Order.findById(orderId).populate("items.product", "title name images price");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     const requestingUserId = req.user?.id || req.user?._id;
//     const isOwner = String(order.user) === String(requestingUserId);
//     const adminFlag = req.user?.role === "admin";

//     if (!isOwner && !adminFlag) {
//       return res.status(403).json({ success: false, message: "Not authorized to cancel" });
//     }

//     if (!["Pending", "Accepted"].includes(order.status)) {
//       return res.status(400).json({ success: false, message: "Cannot cancel after shipping" });
//     }

//     order.status = "Cancelled";
//     await order.save();

//     // Notify user/admin about cancellation (non-blocking)
//     (async () => {
//       try {
//         const itemsHtml = formatItemsHtml(order.items);
//         const itemsText = formatItemsText(order.items);

//         const userEmail = order.address?.email || order.user?.email || null;
//         const userPhone = order.address?.mobileNo || null;
//         const adminEmail = process.env.ADMIN_EMAIL;
//         const adminPhone = process.env.ADMIN_PHONE;

//         const subjectUser = `[${process.env.APP_NAME || "App"}] Order cancelled (${order._id})`;
//         const htmlUser = `<p>Your order <strong>${order._id}</strong> has been cancelled.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`;
//         const smsUser = `${process.env.APP_NAME || "App"}: Order ${String(order._id).slice(-6)} cancelled.`;

//         await safeNotify({
//           mailTo: userEmail,
//           mailSubject: subjectUser,
//           mailHtml: htmlUser,
//           mailText: `Order ${order._id} cancelled.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
//           smsTo: userPhone,
//           smsBody: smsUser,
//         });

//         await safeNotify({
//           mailTo: adminEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Order cancelled ${order._id}`,
//           mailHtml: `<p>Order ${order._id} was cancelled by ${req.user?.id || "admin"}.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`,
//           mailText: `Order ${order._id} cancelled by ${req.user?.id || "admin"}.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
//           smsTo: adminPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Order ${String(order._id).slice(-6)} cancelled.`,
//         });
//       } catch (err) {
//         console.warn("Cancellation notification err:", err);
//       }
//     })();

//     const safeObj = order.toObject();
//     if (safeObj.paymentVerification) {
//       delete safeObj.paymentVerification.otp;
//       delete safeObj.paymentVerification.otpExpires;
//     }

//     res.json({ success: true, message: "Order cancelled successfully", order: safeObj });
//   } catch (err) {
//     console.error("PUT /cancel/:orderId error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Admin: update status (Accept / Shipped / Delivered / Cancelled etc.)
//  * PUT /api/orders/status/:orderId
//  */
// router.put("/status/:orderId", requiredSignIn, isAdmin, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;
//     const allowed = ["Pending", "Accepted", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Pending Pickup", "Collected"];
//     if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

//     const order = await Order.findById(orderId).populate("user", "name email").populate("items.product", "title name images price");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     order.status = status;
//     await order.save();
//     await order.populate("items.product", "title name images price");
//     await order.populate("user", "name email");

//     // build items summary for notifications
//     const itemsHtml = formatItemsHtml(order.items);
//     const itemsText = formatItemsText(order.items);

//     // Notifications for status change (non-blocking)
//     (async () => {
//       try {
//         const userEmail = order.user?.email;
//         const userPhone = order.address?.mobileNo;
//         const adminEmail = process.env.ADMIN_EMAIL;
//         const adminPhone = process.env.ADMIN_PHONE;
//         const shortId = String(order._id).slice(-6);

//         const subjectUser = `[${process.env.APP_NAME || "App"}] Order ${status} (${order._id})`;
//         const htmlUser = `<p>Your order <strong>${order._id}</strong> is now <strong>${status}</strong>.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`;
//         const smsUser = `${process.env.APP_NAME || "App"}: Order ${shortId} is ${status}.`;

//         await safeNotify({
//           mailTo: userEmail,
//           mailSubject: subjectUser,
//           mailHtml: htmlUser,
//           mailText: `Order ${order._id} is ${status}.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
//           smsTo: userPhone,
//           smsBody: smsUser,
//         });

//         // admin notify
//         await safeNotify({
//           mailTo: adminEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Order ${status} - ${order._id}`,
//           mailHtml: `<p>Order ${order._id} status changed to ${status} by admin.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`,
//           mailText: `Order ${order._id} status changed to ${status}.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
//           smsTo: adminPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} marked ${status}.`,
//         });
//       } catch (err) {
//         console.warn("Status change notification error:", err);
//       }
//     })();

//     const safeOrder = order.toObject();
//     if (safeOrder.paymentVerification) {
//       delete safeOrder.paymentVerification.otp;
//       delete safeOrder.paymentVerification.otpExpires;
//     }

//     res.json({ success: true, message: "Order status updated", order: safeOrder });
//   } catch (err) {
//     console.error("PUT /status/:orderId error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Admin: get all orders (optional status filter)
//  * GET /api/orders
//  */
// router.get("/", requiredSignIn, isAdmin, async (req, res) => {
//   try {
//     const { status } = req.query;
//     const filter = status && status !== "All" ? { status } : {};
//     const orders = await Order.find(filter)
//       .populate("items.product", "title name images price")
//       .populate("user", "name email");

//     const safe = orders.map((o) => {
//       const obj = o.toObject();
//       if (obj.paymentVerification) {
//         delete obj.paymentVerification.otp;
//         delete obj.paymentVerification.otpExpires;
//       }
//       return obj;
//     });

//     res.json({ success: true, orders: safe });
//   } catch (err) {
//     console.error("GET / orders error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Admin: get all return/refund requests
//  * GET /api/orders/return-orders
//  */
// router.get("/return-orders", requiredSignIn, isAdmin, async (req, res) => {
//   try {
//     const orders = await Order.find({ "returnRefund.status": { $in: ["Requested", "Approved", "Pending Pickup"] } })
//       .populate("items.product", "title images price")
//       .populate("user", "name email");

//     const safe = orders.map((o) => {
//       const obj = o.toObject();
//       if (obj.paymentVerification) {
//         delete obj.paymentVerification.otp;
//         delete obj.paymentVerification.otpExpires;
//       }
//       return obj;
//     });

//     res.json({ success: true, returnOrders: safe });
//   } catch (err) {
//     console.error("GET /return-orders error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * POST /api/orders/return/:orderId
//  * Submit return/refund request (by user)
//  */
// router.post("/return/:orderId", requiredSignIn, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { type, reason, upi } = req.body;
//     const userId = req.user?.id || req.user?._id;

//     const order = await Order.findById(orderId).populate("items.product", "title images price").populate("user", "name email");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     if (String(order.user) !== String(userId) && req.user?.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Not authorized to request return for this order" });
//     }

//     if (order.status !== "Delivered") {
//       return res.status(400).json({ success: false, message: "Return/refund allowed only after delivery" });
//     }

//     if (!order.returnRefund) order.returnRefund = {};

//     order.returnRefund.requestType = type || "Refund";
//     order.returnRefund.reason = reason || "";
//     order.returnRefund.upi = upi || "";
//     order.returnRefund.status = "Requested";
//     order.returnRefund.requestDate = new Date();

//     await order.save();
//     await order.populate("items.product", "title images price");
//     await order.populate("user", "name email");

//     // notify admin + user (non-blocking)
//     (async () => {
//       try {
//         const adminEmail = process.env.ADMIN_EMAIL;
//         const adminPhone = process.env.ADMIN_PHONE;
//         const itemsHtml = formatItemsHtml(order.items);
//         const itemsText = formatItemsText(order.items);
//         const subj = `[${process.env.APP_NAME || "App"}] Return requested (${order._id})`;
//         await safeNotify({
//           mailTo: adminEmail,
//           mailSubject: subj,
//           mailHtml: `<p>Return requested for order ${order._id}</p>${itemsHtml}<p>Reason: ${order.returnRefund.reason}</p>`,
//           mailText: `Return requested for order ${order._id}\n\n${itemsText}`,
//           smsTo: adminPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Return requested for order ${String(order._id).slice(-6)}.`,
//         });

//         const userEmail = order.user?.email;
//         const userPhone = order.address?.mobileNo;
//         if (userEmail || userPhone) {
//           await safeNotify({
//             mailTo: userEmail,
//             mailSubject: `[${process.env.APP_NAME || "App"}] Return request received (${order._id})`,
//             mailHtml: `<p>Return request received for ${order._id}. We'll update you shortly.</p>${itemsHtml}`,
//             mailText: `Return request received for ${order._id}.\n\n${itemsText}`,
//             smsTo: userPhone,
//             smsBody: `${process.env.APP_NAME || "App"}: Return request received for order ${String(order._id).slice(-6)}.`,
//           });
//         }
//       } catch (err) {
//         console.warn("return notify err:", err);
//       }
//     })();

//     const safe = order.toObject();
//     if (safe.paymentVerification) {
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     res.json({ success: true, message: "Return/refund request submitted", order: safe });
//   } catch (err) {
//     console.error("POST /return/:orderId error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Admin: Approve / Reject / Mark Collected for return/refund
//  * PUT /api/orders/return/:orderId
//  */
// router.put("/return/:orderId", requiredSignIn, isAdmin, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { action } = req.body;
//     if (!["Approved", "Rejected", "Collected"].includes(action)) {
//       return res.status(400).json({ success: false, message: "Invalid action" });
//     }

//     const order = await Order.findById(orderId).populate("items.product", "title images price").populate("user", "name email");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     if (!order.returnRefund) order.returnRefund = { status: "Not Requested" };

//     if (action === "Approved") {
//       order.returnRefund.status = "Approved";
//       order.returnRefund.acceptedBy = req.user?.id || req.user?._id || null;
//       order.returnRefund.acceptedAt = new Date();
//       order.status = "Pending Pickup";
//     } else if (action === "Rejected") {
//       order.returnRefund.status = "Rejected";
//     } else if (action === "Collected") {
//       order.returnRefund.status = "Collected";
//       order.returnRefund.collectedAt = new Date();
//       order.status = "Collected";
//     }

//     await order.save();
//     await order.populate("items.product", "title images price");
//     await order.populate("user", "name email");

//     // notify user/admin (reuse safeNotify)... (omitted here for brevity; same as original)
//     (async () => {
//       try {
//         // notifications
//         const userEmail = order.user?.email;
//         const userPhone = order.address?.mobileNo;
//         const adminEmail = process.env.ADMIN_EMAIL;
//         const adminPhone = process.env.ADMIN_PHONE;
//         const itemsHtml = formatItemsHtml(order.items);
//         if (action === "Approved") {
//           await safeNotify({
//             mailTo: userEmail,
//             mailSubject: `[${process.env.APP_NAME || "App"}] Your return request approved (${order._id})`,
//             mailHtml: `<p>Your return for ${order._id} is approved.</p>${itemsHtml}`,
//             mailText: `Your return for ${order._id} is approved.`,
//             smsTo: userPhone,
//             smsBody: `${process.env.APP_NAME || "App"}: Return approved for order ${String(order._id).slice(-6)}.`,
//           });
//         } else if (action === "Rejected") {
//           await safeNotify({
//             mailTo: userEmail,
//             mailSubject: `[${process.env.APP_NAME || "App"}] Your return request rejected (${order._id})`,
//             mailHtml: `<p>Your return for ${order._id} was rejected.</p>${itemsHtml}`,
//             mailText: `Your return for ${order._id} was rejected.`,
//             smsTo: userPhone,
//             smsBody: `${process.env.APP_NAME || "App"}: Return rejected for order ${String(order._id).slice(-6)}.`,
//           });
//         } else if (action === "Collected") {
//           await safeNotify({
//             mailTo: userEmail,
//             mailSubject: `[${process.env.APP_NAME || "App"}] Return collected (${order._id})`,
//             mailHtml: `<p>Pickup collected for ${order._id}.</p>${itemsHtml}`,
//             mailText: `Pickup collected for ${order._id}.`,
//             smsTo: userPhone,
//             smsBody: `${process.env.APP_NAME || "App"}: Return collected for order ${String(order._id).slice(-6)}.`,
//           });
//         }

//         await safeNotify({
//           mailTo: adminEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Return ${action} - ${order._id}`,
//           mailHtml: `<p>Return ${action} for ${order._id}</p>`,
//           mailText: `Return ${action} for ${order._id}`,
//           smsTo: adminPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Return ${action} for ${String(order._id).slice(-6)}.`,
//         });
//       } catch (err) {
//         console.warn("return action notify err:", err);
//       }
//     })();

//     const safe = order.toObject();
//     if (safe.paymentVerification) {
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     res.json({ success: true, message: "Return/refund updated", order: safe });
//   } catch (err) {
//     console.error("PUT /return/:orderId error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Resend OTP for an order (authenticated owner or admin)
//  * POST /api/orders/resend-otp/:orderId
//  */
// router.post("/resend-otp/:orderId", requiredSignIn, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order id" });

//     const order = await Order.findById(orderId).populate("user", "name email");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     const requestingUserId = req.user?.id || req.user?._id;
//     if (String(order.user) !== String(requestingUserId) && req.user?.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Forbidden" });
//     }

//     const otp = generateOtp();
//     const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
//     order.paymentVerification = {
//       method: order.paymentVerification?.method || "Both",
//       otp,
//       otpExpires,
//       status: "Pending",
//       verifiedAt: null,
//     };
//     await order.save();

//     // Send OTP to user (non-blocking)
//     (async () => {
//       try {
//         const userEmail = order.user?.email || order.address?.email;
//         const userPhone = order.address?.mobileNo;
//         if (userEmail) {
//           await safeNotify({
//             mailTo: userEmail,
//             mailSubject: `[${process.env.APP_NAME || "App"}] Your verification code for order ${order._id}`,
//             mailHtml: otpMessageHtml(otp, 10),
//             mailText: otpMessageText(otp, 10),
//           });
//         }
//         if (userPhone) {
//           await safeNotify({
//             smsTo: userPhone,
//             smsBody: `${process.env.APP_NAME || "App"}: ${otpMessageText(otp, 10)} Order: ${String(order._id).slice(-6)}`,
//           });
//         }
//       } catch (err) {
//         console.warn("resend otp notify err:", err);
//       }
//     })();

//     res.json({ success: true, message: "OTP resent" });
//   } catch (err) {
//     console.error("POST /resend-otp error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Verify payment OTP manually (optional) - updates paymentVerification.status and does NOT mark Delivered
//  * POST /api/orders/verify-payment/:orderId  Body: { otp }
//  */
// router.post("/verify-payment/:orderId", requiredSignIn, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { otp } = req.body;
//     if (!otp) return res.status(400).json({ success: false, message: "OTP required" });

//     if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order id" });

//     const order = await Order.findById(orderId).populate("user", "name email");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     const requestingUserId = req.user?.id || req.user?._id;
//     if (String(order.user) !== String(requestingUserId) && req.user?.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Forbidden" });
//     }

//     if (!order.paymentVerification || !order.paymentVerification.otp) return res.status(400).json({ success: false, message: "No OTP for this order" });
//     if (order.paymentVerification.otpExpires && new Date() > new Date(order.paymentVerification.otpExpires)) return res.status(400).json({ success: false, message: "OTP expired. Resend and try again." });
//     if (String(order.paymentVerification.otp).trim() !== String(otp).trim()) return res.status(400).json({ success: false, message: "Invalid OTP" });

//     order.paymentVerification.status = "Verified";
//     order.paymentVerification.verifiedAt = new Date();
//     await order.save();
//     await order.populate("items.product", "title images price");
//     await order.populate("user", "name email");

//     const safe = order.toObject();
//     if (safe.paymentVerification) {
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     // Notify user/admin about verification (non-blocking)
//     (async () => {
//       try {
//         const userEmail = order.user?.email || order.address?.email;
//         const userPhone = order.address?.mobileNo;
//         const adminEmail = process.env.ADMIN_EMAIL;
//         const adminPhone = process.env.ADMIN_PHONE;
//         const shortId = String(order._id).slice(-6);

//         if (userEmail || userPhone) {
//           await safeNotify({
//             mailTo: userEmail,
//             mailSubject: `[${process.env.APP_NAME || "App"}] Verified for order ${order._id}`,
//             mailHtml: `<p>Your verification for order <strong>${order._id}</strong> is successful.</p>`,
//             mailText: `Verification for order ${order._id} successful.`,
//             smsTo: userPhone,
//             smsBody: `${process.env.APP_NAME || "App"}: Verified for order ${shortId}.`,
//           });
//         }

//         await safeNotify({
//           mailTo: adminEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Order payment verified - ${order._id}`,
//           mailHtml: `<p>Order ${order._id} payment verification successful.</p>`,
//           mailText: `Order ${order._id} payment verification successful.`,
//           smsTo: adminPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Payment verified for ${shortId}.`,
//         });
//       } catch (err) {
//         console.warn("verify notify err:", err);
//       }
//     })();

//     res.json({ success: true, message: "Payment verified", order: safe });
//   } catch (err) {
//     console.error("POST /verify-payment error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ---------------------- PUBLIC (no-auth) endpoints for delivery/courier flow ---------------------- */

// /**
//  * Public: send OTP for delivery to customer
//  * POST /api/orders/public/:id/send-otp
//  * - No sign-in required (intended for deliveryman)
//  * - Generates a 6-digit OTP, stores it on order.paymentVerification (otp & otpExpires)
//  * - Sends OTP to customer email and/or SMS (non-blocking)
//  */
// router.post("/public/:id/send-otp", async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order id" });

//     const order = await Order.findById(id).populate("user", "name email");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     // generate OTP
//     const otp = generateOtp();
//     const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

//     order.paymentVerification = {
//       method: order.paymentVerification?.method || "Both",
//       otp,
//       otpExpires,
//       status: "Pending",
//       verifiedAt: null,
//     };

//     await order.save();

//     // send OTP to customer (non-blocking)
//     (async () => {
//       try {
//         const userEmail = order.user?.email || order.address?.email;
//         const userPhone = order.address?.mobileNo;
//         const shortId = String(order._id).slice(-6);
//         const subject = `[${process.env.APP_NAME || "App"}] Your delivery OTP for order ${shortId}`;
//         const html = `<p>Your delivery OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
//         const text = `Your delivery OTP is ${otp}. It expires in 10 minutes.`;
//         const sms = `${process.env.APP_NAME || "App"}: OTP ${otp} for order ${shortId}. Expires in 10 min.`;

//         await safeNotify({
//           mailTo: userEmail,
//           mailSubject: subject,
//           mailHtml: html,
//           mailText: text,
//           smsTo: userPhone,
//           smsBody: sms,
//         });
//       } catch (notifyErr) {
//         console.warn("public send-otp notify err:", notifyErr);
//       }
//     })();

//     // Build safe order to return (no OTP values)
//     const safe = order.toObject();
//     if (safe.paymentVerification) {
//       if (process.env.DEBUG === "true") {
//         // include debug OTP only when DEBUG=true in local/dev
//         safe.paymentVerification._debugOtp = order.paymentVerification.otp;
//       }
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     res.json({ success: true, message: "OTP sent to customer (email/SMS) if available", order: safe });
//   } catch (err) {
//     console.error("POST /public/:id/send-otp error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Public: verify OTP and mark delivered (atomic)
//  * PUT /api/orders/public/:id/deliver
//  * Body: { otp: "123456" }
//  * - No sign-in required (intended for deliveryman)
//  * - Verifies OTP stored on order.paymentVerification and expiry
//  * - Marks order.status = "Delivered" if valid and not already delivered
//  */
// router.put("/public/:id/deliver", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { otp } = req.body;
//     if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order id" });
//     if (!otp) return res.status(400).json({ success: false, message: "OTP required" });

//     const now = new Date();

//     // Use findOneAndUpdate to atomically match the OTP and expiry and set status
//     const updated = await Order.findOneAndUpdate(
//       {
//         _id: id,
//         "paymentVerification.otp": String(otp).trim(),
//         "paymentVerification.otpExpires": { $gt: now }
//       },
//       {
//         $set: {
//           "paymentVerification.status": "Verified",
//           "paymentVerification.verifiedAt": now,
//           status: "Delivered",
//           updatedAt: now
//         }
//       },
//       { new: true }
//     )
//       .populate("items.product", "title name images price")
//       .populate("user", "name email");

//     if (!updated) {
//       // check why it failed: find the order and return more helpful message
//       const order = await Order.findById(id).populate("user", "name email");
//       if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//       console.warn("public/deliver - order.paymentVerification:", !!order.paymentVerification);
//       if (order.paymentVerification) {
//         console.warn("public/deliver - paymentVerification details:", {
//           hasOtp: !!order.paymentVerification.otp,
//           otpValue: process.env.DEBUG === "true" ? order.paymentVerification.otp : "<hidden>",
//           otpExpires: order.paymentVerification.otpExpires
//         });
//       }

//       if (!order.paymentVerification || !order.paymentVerification.otp) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "No OTP configured for this order. Use /api/orders/public/:id/send-otp to send one to the customer."
//         });
//       }
//       if (order.paymentVerification.otpExpires && new Date() > new Date(order.paymentVerification.otpExpires)) {
//         return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
//       }

//       // fallback: OTP mismatch
//       return res.status(400).json({ success: false, message: "Invalid OTP" });
//     }

//     // remove OTP fields before returning
//     const safe = updated.toObject();
//     if (safe.paymentVerification) {
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     // notifications (same as before, non-blocking)
//     (async () => {
//       try {
//         const shortId = String(updated._id).slice(-6);
//         const userEmail = updated.user?.email || updated.address?.email;
//         const userPhone = updated.address?.mobileNo;
//         const adminEmail = process.env.ADMIN_EMAIL;
//         const adminPhone = process.env.ADMIN_PHONE;

//         await safeNotify({
//           mailTo: userEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Your order ${shortId} delivered`,
//           mailHtml: `<p>Your order <strong>${shortId}</strong> has been delivered.</p>`,
//           mailText: `Your order ${shortId} has been delivered.`,
//           smsTo: userPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
//         });

//         await safeNotify({
//           mailTo: adminEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Order ${shortId} delivered`,
//           mailHtml: `<p>Order ${shortId} marked delivered via public deliver endpoint.</p>`,
//           mailText: `Order ${shortId} delivered.`,
//           smsTo: adminPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
//         });
//       } catch (nerr) {
//         console.warn("public deliver notify err:", nerr);
//       }
//     })();

//     return res.json({ success: true, message: "Order marked as delivered", order: safe });
//   } catch (err) {
//     console.error("PUT /public/:id/deliver error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /* ---------------------- PROTECTED deliver endpoint (for auth'ed users) ---------------------- */

// /**
//  * Mark delivered (protected) - atomic OTP verification for non-admins
//  * PUT /api/orders/:orderId/deliver
//  * Body: { otp?: "123456" } - admins bypass OTP
//  */
// router.put("/:orderId/deliver", requiredSignIn, async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { otp } = req.body;
//     const callerId = req.user?.id || req.user?._id;
//     const isAdminUser = req.user?.role === "admin";

//     if (!mongoose.Types.ObjectId.isValid(orderId)) {
//       return res.status(400).json({ success: false, message: "Invalid order id" });
//     }

//     // Admins should be able to mark delivered without OTP.
//     if (isAdminUser) {
//       const updated = await Order.findByIdAndUpdate(
//         orderId,
//         { $set: { status: "Delivered", updatedAt: new Date() } },
//         { new: true }
//       )
//         .populate("items.product", "title name images price")
//         .populate("user", "name email");

//       if (!updated) return res.status(404).json({ success: false, message: "Order not found" });

//       const safe = updated.toObject();
//       if (safe.paymentVerification) {
//         delete safe.paymentVerification.otp;
//         delete safe.paymentVerification.otpExpires;
//       }
//       return res.json({ success: true, message: "Order marked delivered by admin", order: safe });
//     }

//     // Non-admin: must be owner or courier
//     const order = await Order.findById(orderId).populate("user", "name email");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     const isOwner = String(order.user?._id || order.user) === String(callerId);
//     const isCourier = req.user?.role === "courier";
//     if (!isOwner && !isCourier) {
//       return res.status(403).json({ success: false, message: "Not authorized to mark delivered" });
//     }

//     // Ensure OTP present
//     if (!order.paymentVerification || !order.paymentVerification.otp) {
//       return res.status(400).json({ success: false, message: "No OTP configured for this order. Send OTP first." });
//     }

//     if (!otp) return res.status(400).json({ success: false, message: "OTP required" });

//     // Use atomic update to ensure we only set to Delivered when OTP matches & not expired
//     const now = new Date();
//     const updated = await Order.findOneAndUpdate(
//       {
//         _id: orderId,
//         "paymentVerification.otp": String(otp).trim(),
//         "paymentVerification.otpExpires": { $gt: now }
//       },
//       {
//         $set: {
//           "paymentVerification.status": "Verified",
//           "paymentVerification.verifiedAt": now,
//           status: "Delivered",
//           updatedAt: now
//         }
//       },
//       { new: true }
//     )
//       .populate("items.product", "title name images price")
//       .populate("user", "name email");

//     if (!updated) {
//       // re-check order for more helpful error
//       const fresh = await Order.findById(orderId);
//       console.warn("protected/deliver - fresh.paymentVerification:", !!(fresh && fresh.paymentVerification));
//       if (!fresh.paymentVerification || !fresh.paymentVerification.otp) {
//         return res.status(400).json({ success: false, message: "No OTP configured for this order. Send OTP first." });
//       }
//       if (fresh.paymentVerification.otpExpires && new Date() > new Date(fresh.paymentVerification.otpExpires)) {
//         return res.status(400).json({ success: false, message: "OTP expired. Please resend and try again." });
//       }
//       return res.status(400).json({ success: false, message: "Invalid OTP" });
//     }

//     const safe = updated.toObject();
//     if (safe.paymentVerification) {
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     // Notify asynchronously (same as earlier)
//     (async () => {
//       try {
//         const shortId = String(updated._id).slice(-6);
//         const userEmail = updated.user?.email || updated.address?.email;
//         const userPhone = updated.address?.mobileNo;
//         const adminEmail = process.env.ADMIN_EMAIL;
//         const adminPhone = process.env.ADMIN_PHONE;

//         await safeNotify({
//           mailTo: userEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Order delivered (${shortId})`,
//           mailHtml: `<p>Your order <strong>${shortId}</strong> has been delivered.</p>`,
//           mailText: `Order ${shortId} delivered.`,
//           smsTo: userPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
//         });

//         await safeNotify({
//           mailTo: adminEmail,
//           mailSubject: `[${process.env.APP_NAME || "App"}] Order ${shortId} delivered`,
//           mailHtml: `<p>Order ${shortId} has been delivered (marked by user/courier).</p>`,
//           mailText: `Order ${shortId} delivered.`,
//           smsTo: adminPhone,
//           smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
//         });
//       } catch (nerr) {
//         console.warn("protected deliver notify err:", nerr);
//       }
//     })();

//     return res.json({ success: true, message: "Order marked as delivered", order: safe });
//   } catch (err) {
//     console.error("PUT /:orderId/deliver error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * Get order by ID (owner or admin)
//  * GET /api/orders/:id
//  */
// router.get("/:id", requiredSignIn, async (req, res) => {
//   try {
//     const param = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(param)) {
//       return res.status(400).json({ success: false, message: "Invalid order id" });
//     }

//     const order = await Order.findById(param)
//       .populate("items.product", "title name images price")
//       .populate("user", "name email");
//     if (!order) return res.status(404).json({ success: false, message: "Order not found" });

//     const requestingUserId = req.user?.id || req.user?._id;
//     if (String(order.user._id) !== String(requestingUserId) && req.user?.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Forbidden" });
//     }

//     const safe = order.toObject();
//     if (safe.paymentVerification) {
//       delete safe.paymentVerification.otp;
//       delete safe.paymentVerification.otpExpires;
//     }

//     res.json({ success: true, order: safe });
//   } catch (err) {
//     console.error("GET /:id order error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// export default router;



// src/routes/orders.js
import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/post.js"; // your Post model (product) - uses `guest` as numeric stock
import { requiredSignIn, isAdmin } from "../middlewares/Auth.js";
import { sendMail } from "../utils/mailer.js";
import { sendSms } from "../utils/sms.js";

const router = express.Router();

/* ---------------------- Helper utilities (notifications / formatting) ---------------------- */

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

async function safeNotify({ mailTo, mailSubject, mailHtml, mailText, smsTo, smsBody }) {
  try {
    if (mailTo) await sendMail({ to: mailTo, subject: mailSubject, html: mailHtml, text: mailText });
  } catch (err) {
    console.warn("safeNotify - mail error:", err?.message || err);
  }

  try {
    if (smsTo) await sendSms({ to: smsTo, body: smsBody });
  } catch (err) {
    console.warn("safeNotify - sms error:", err?.message || err);
  }
}

function formatItemsHtml(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "<p>No items</p>";
  const rows = items
    .map((it) => {
      const prod = it.product || {};
      const title = prod.title || prod.name || "Product";
      const qty = it.quantity || 0;
      const price = it.priceAtPurchase ?? prod.price ?? 0;
      const lineTotal = price * qty;
      return `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${title}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${price}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">₹${lineTotal}</td>
    </tr>`;
    })
    .join("");
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:6px">
      <thead><tr>
        <th style="text-align:left;padding:6px 12px;border-bottom:1px solid #ddd">Product</th>
        <th style="text-align:center;padding:6px 12px;border-bottom:1px solid #ddd">Qty</th>
        <th style="text-align:right;padding:6px 12px;border-bottom:1px solid #ddd">Price</th>
        <th style="text-align:right;padding:6px 12px;border-bottom:1px solid #ddd">Line</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatItemsText(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "No items";
  return items
    .map((it) => {
      const prod = it.product || {};
      const title = prod.title || prod.name || "Product";
      const qty = it.quantity || 0;
      const price = it.priceAtPurchase ?? prod.price ?? 0;
      const lineTotal = price * qty;
      return `${title} — Qty: ${qty} — ₹${price} — Line: ₹${lineTotal}`;
    })
    .join("\n");
}

function otpMessageText(otp, minutes = 10) {
  return `Your verification code is ${otp}. It expires in ${minutes} minutes. Do not share this code with anyone.`;
}
function otpMessageHtml(otp, minutes = 10) {
  return `<p>Your verification code is <strong>${otp}</strong>. It expires in ${minutes} minutes.</p><p>Do not share this code with anyone.</p>`;
}

/* ---------------------- Stock helpers (transactions + idempotency) ---------------------- */

/**
 * changeProductStock(session, productId, delta)
 * - delta: negative to reduce, positive to add back
 * - updates `guest` field on Product (Post) model (your product quantity)
 * - throws if product not found or would go negative
 */
async function changeProductStock(session, productId, delta) {
  const prod = await Product.findById(productId).session(session);
  if (!prod) throw new Error(`Product not found: ${productId}`);

  // Using `guest` as numeric stock based on your Post model earlier
  const current = Number(prod.guest || 0);
  const next = current + Number(delta);

  if (next < 0) {
    throw new Error(`Insufficient stock for product ${productId} (current ${current}, delta ${delta})`);
  }

  prod.guest = next;
  await prod.save({ session });
}

/**
 * applyStockReductionForOrder(orderId)
 * - runs a transaction that sets stockReduced and decrements product quantities
 */
async function applyStockReductionForOrder(orderId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session).populate("items.product");
    if (!order) throw new Error("Order not found");

    if (order.stockReduced) {
      // already applied; nothing to do
      await session.commitTransaction();
      session.endSession();
      return order;
    }

    // decrement each product
    for (const it of order.items) {
      const pid = it.product && (it.product._id || it.product);
      const qty = Number(it.quantity || 0);
      if (!pid || qty <= 0) continue;
      await changeProductStock(session, pid, -qty);
    }

    order.stockReduced = true;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();
    return order;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

/**
 * applyStockRestoreForOrder(orderId)
 * - runs a transaction that sets stockRestored and increments product quantities
 */
async function applyStockRestoreForOrder(orderId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session).populate("items.product");
    if (!order) throw new Error("Order not found");

    if (order.stockRestored) {
      await session.commitTransaction();
      session.endSession();
      return order;
    }

    // increment each product
    for (const it of order.items) {
      const pid = it.product && (it.product._id || it.product);
      const qty = Number(it.quantity || 0);
      if (!pid || qty <= 0) continue;
      await changeProductStock(session, pid, +qty);
    }

    order.stockRestored = true;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();
    return order;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

/* ---------------------- Routes ---------------------- */

/**
 * Create a new order (authenticated)
 * POST /api/orders/create
 */
router.post("/create", requiredSignIn, async (req, res) => {
  try {
    const { items, address, paymentMethod, userId: bodyUserId } = req.body;
    const userId = bodyUserId || req.user?.id || req.user?._id;
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return {
          product: product._id,
          quantity: item.quantity,
          priceAtPurchase: product.price ?? 0,
        };
      })
    );

    const total = orderItems.reduce((acc, it) => acc + it.priceAtPurchase * it.quantity, 0);

    const newOrder = new Order({
      user: userId,
      items: orderItems,
      total,
      address,
      paymentMethod: paymentMethod || "COD",
      status: "Pending",
      returnRefund: { status: "Not Requested" },
    });

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    newOrder.paymentVerification = {
      method: "Both",
      otp,
      otpExpires,
      status: "Pending",
    };

    await newOrder.save();
    await newOrder.populate("items.product", "title name images price");
    await newOrder.populate("user", "name email");

    const safeOrder = newOrder.toObject();
    if (safeOrder.paymentVerification) {
      delete safeOrder.paymentVerification.otp;
      delete safeOrder.paymentVerification.otpExpires;
    }

    // notify admin + user (non-blocking)
    (async () => {
      try {
        const itemsHtml = formatItemsHtml(newOrder.items);
        const itemsText = formatItemsText(newOrder.items);

        if (process.env.ADMIN_EMAIL || process.env.ADMIN_PHONE) {
          const subject = `[${process.env.APP_NAME || "App"}] New order placed (${String(newOrder._id).slice(-6)})`;
          const html = `<p>New order placed.</p><p>Order ID: <strong>${newOrder._id}</strong></p>${itemsHtml}<p><strong>Total:</strong> ₹${newOrder.total}</p>`;
          const sms = `${process.env.APP_NAME || "App"}: New order ${String(newOrder._id).slice(-6)} placed. Total ₹${newOrder.total}.`;
          await safeNotify({
            mailTo: process.env.ADMIN_EMAIL,
            mailSubject: subject,
            mailHtml: html,
            mailText: `${subject}\n\n${itemsText}\n\nTotal: ₹${newOrder.total}`,
            smsTo: process.env.ADMIN_PHONE,
            smsBody: sms,
          });
        }

        const userEmail = newOrder.user?.email || newOrder.address?.email;
        const userPhone = newOrder.address?.mobileNo;
        if (userEmail || userPhone) {
          const subject = `[${process.env.APP_NAME || "App"}] Verify for order ${String(newOrder._id).slice(-6)}`;
          const html = `<p>Thanks — your order <strong>${newOrder._id}</strong> has been placed. Use the code below to confirm delivery when completing the order.</p>${itemsHtml}${otpMessageHtml(otp, 10)}<p><strong>Total:</strong> ₹${newOrder.total}</p>`;
          const text = `Order ${newOrder._id} placed. ${itemsText}\n\n${otpMessageText(otp, 10)}\n\nTotal: ₹${newOrder.total}`;
          const smsBody = `${process.env.APP_NAME || "App"}: Order ${String(newOrder._id).slice(-6)} placed. ${otpMessageText(otp, 10)}`;
          await safeNotify({
            mailTo: userEmail,
            mailSubject: subject,
            mailHtml: html,
            mailText: text,
            smsTo: userPhone,
            smsBody,
          });
        }
      } catch (err) {
        console.warn("create notifications err:", err);
      }
    })();

    res.json({ success: true, message: "Order created", order: safeOrder });
  } catch (err) {
    console.error("POST /create order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Public: get public-safe order by id (no auth)
 * GET /api/orders/public/:id
 */
router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findById(id)
      .populate("items.product", "title name images price")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const safe = order.toObject();
    if (safe.paymentVerification) {
      delete safe.paymentVerification.otp;
      delete safe.paymentVerification.otpExpires;
    }

    return res.json({ success: true, order: safe });
  } catch (err) {
    console.error("GET /public/:id error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get orders for a specific user (authenticated).
 * GET /api/orders/user/:userId
 */
router.get("/user/:userId", requiredSignIn, async (req, res) => {
  try {
    const userId = req.params.userId;
    const requestingUserId = req.user?.id || req.user?._id;
    if (!requestingUserId) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (String(requestingUserId) !== String(userId) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const orders = await Order.find({ user: userId })
      .populate("items.product", "title name images price")
      .populate("user", "name email");

    const safe = orders.map((o) => {
      const obj = o.toObject();
      if (obj.paymentVerification) {
        delete obj.paymentVerification.otp;
        delete obj.paymentVerification.otpExpires;
      }
      return obj;
    });

    res.json({ success: true, orders: safe });
  } catch (err) {
    console.error("GET /user/:userId error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Cancel order (owner or admin) - allowed if Pending or Accepted
 */
router.put("/cancel/:orderId", requiredSignIn, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("items.product", "title name images price");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const requestingUserId = req.user?.id || req.user?._id;
    const isOwner = String(order.user) === String(requestingUserId);
    const adminFlag = req.user?.role === "admin";

    if (!isOwner && !adminFlag) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel" });
    }

    if (!["Pending", "Accepted"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel after shipping" });
    }

    order.status = "Cancelled";
    await order.save();

    // Notifications (non-blocking)
    (async () => {
      try {
        const itemsHtml = formatItemsHtml(order.items);
        const itemsText = formatItemsText(order.items);

        const userEmail = order.address?.email || order.user?.email || null;
        const userPhone = order.address?.mobileNo || null;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;

        const subjectUser = `[${process.env.APP_NAME || "App"}] Order cancelled (${order._id})`;
        const htmlUser = `<p>Your order <strong>${order._id}</strong> has been cancelled.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`;
        const smsUser = `${process.env.APP_NAME || "App"}: Order ${String(order._id).slice(-6)} cancelled.`;

        await safeNotify({
          mailTo: userEmail,
          mailSubject: subjectUser,
          mailHtml: htmlUser,
          mailText: `Order ${order._id} cancelled.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
          smsTo: userPhone,
          smsBody: smsUser,
        });

        await safeNotify({
          mailTo: adminEmail,
          mailSubject: `[${process.env.APP_NAME || "App"}] Order cancelled ${order._id}`,
          mailHtml: `<p>Order ${order._id} was cancelled by ${req.user?.id || "admin"}.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`,
          mailText: `Order ${order._id} cancelled by ${req.user?.id || "admin"}.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
          smsTo: adminPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Order ${String(order._id).slice(-6)} cancelled.`,
        });
      } catch (err) {
        console.warn("Cancellation notification err:", err);
      }
    })();

    const safeObj = order.toObject();
    if (safeObj.paymentVerification) {
      delete safeObj.paymentVerification.otp;
      delete safeObj.paymentVerification.otpExpires;
    }

    res.json({ success: true, message: "Order cancelled successfully", order: safeObj });
  } catch (err) {
    console.error("PUT /cancel/:orderId error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: update status (Accept / Shipped / Delivered / Cancelled etc.)
 * PUT /api/orders/status/:orderId
 */
router.put("/status/:orderId", requiredSignIn, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const allowed = ["Pending", "Accepted", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Pending Pickup", "Collected"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    const order = await Order.findById(orderId).populate("user", "name email").populate("items.product", "title name images price");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = status;
    await order.save();

    // If admin marked Delivered, attempt to reduce stock (idempotent)
    if (status === "Delivered") {
      try {
        await applyStockReductionForOrder(order._id);
      } catch (stockErr) {
        console.warn("Stock reduction warning:", stockErr);
        // optional: set a warning flag on order object returned (but we will not fail the status update)
      }
    }

    await order.populate("items.product", "title name images price");
    await order.populate("user", "name email");

    const itemsHtml = formatItemsHtml(order.items);
    const itemsText = formatItemsText(order.items);

    (async () => {
      try {
        const userEmail = order.user?.email;
        const userPhone = order.address?.mobileNo;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;
        const shortId = String(order._id).slice(-6);

        const subjectUser = `[${process.env.APP_NAME || "App"}] Order ${status} (${order._id})`;
        const htmlUser = `<p>Your order <strong>${order._id}</strong> is now <strong>${status}</strong>.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`;
        const smsUser = `${process.env.APP_NAME || "App"}: Order ${shortId} is ${status}.`;

        await safeNotify({
          mailTo: userEmail,
          mailSubject: subjectUser,
          mailHtml: htmlUser,
          mailText: `Order ${order._id} is ${status}.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
          smsTo: userPhone,
          smsBody: smsUser,
        });

        await safeNotify({
          mailTo: adminEmail,
          mailSubject: `[${process.env.APP_NAME || "App"}] Order ${status} - ${order._id}`,
          mailHtml: `<p>Order ${order._id} status changed to ${status} by admin.</p>${itemsHtml}<p><strong>Total:</strong> ₹${order.total}</p>`,
          mailText: `Order ${order._id} status changed to ${status}.\n\n${itemsText}\n\nTotal: ₹${order.total}.`,
          smsTo: adminPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} marked ${status}.`,
        });
      } catch (err) {
        console.warn("Status change notification error:", err);
      }
    })();

    const safeOrder = order.toObject();
    if (safeOrder.paymentVerification) {
      delete safeOrder.paymentVerification.otp;
      delete safeOrder.paymentVerification.otpExpires;
    }

    res.json({ success: true, message: "Order status updated", order: safeOrder });
  } catch (err) {
    console.error("PUT /status/:orderId error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: get all orders (optional status filter)
 * GET /api/orders
 */
router.get("/", requiredSignIn, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "All" ? { status } : {};
    const orders = await Order.find(filter)
      .populate("items.product", "title name images price")
      .populate("user", "name email");

    const safe = orders.map((o) => {
      const obj = o.toObject();
      if (obj.paymentVerification) {
        delete obj.paymentVerification.otp;
        delete obj.paymentVerification.otpExpires;
      }
      return obj;
    });

    res.json({ success: true, orders: safe });
  } catch (err) {
    console.error("GET / orders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: get all return/refund requests
 * GET /api/orders/return-orders
 */
router.get("/return-orders", requiredSignIn, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ "returnRefund.status": { $in: ["Requested", "Approved", "Pending Pickup"] } })
      .populate("items.product", "title images price")
      .populate("user", "name email");

    const safe = orders.map((o) => {
      const obj = o.toObject();
      if (obj.paymentVerification) {
        delete obj.paymentVerification.otp;
        delete obj.paymentVerification.otpExpires;
      }
      return obj;
    });

    res.json({ success: true, returnOrders: safe });
  } catch (err) {
    console.error("GET /return-orders error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/orders/return/:orderId
 * Submit return/refund request (by user)
 */
router.post("/return/:orderId", requiredSignIn, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type, reason, upi } = req.body;
    const userId = req.user?.id || req.user?._id;

    const order = await Order.findById(orderId).populate("items.product", "title images price").populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (String(order.user) !== String(userId) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to request return for this order" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Return/refund allowed only after delivery" });
    }

    if (!order.returnRefund) order.returnRefund = {};

    order.returnRefund.requestType = type || "Refund";
    order.returnRefund.reason = reason || "";
    order.returnRefund.upi = upi || "";
    order.returnRefund.status = "Requested";
    order.returnRefund.requestDate = new Date();

    await order.save();
    await order.populate("items.product", "title images price");
    await order.populate("user", "name email");

    (async () => {
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;
        const itemsHtml = formatItemsHtml(order.items);
        const itemsText = formatItemsText(order.items);
        const subj = `[${process.env.APP_NAME || "App"}] Return requested (${order._id})`;
        await safeNotify({
          mailTo: adminEmail,
          mailSubject: subj,
          mailHtml: `<p>Return requested for order ${order._id}</p>${itemsHtml}<p>Reason: ${order.returnRefund.reason}</p>`,
          mailText: `Return requested for order ${order._id}\n\n${itemsText}`,
          smsTo: adminPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Return requested for order ${String(order._id).slice(-6)}.`,
        });

        const userEmail = order.user?.email;
        const userPhone = order.address?.mobileNo;
        if (userEmail || userPhone) {
          await safeNotify({
            mailTo: userEmail,
            mailSubject: `[${process.env.APP_NAME || "App"}] Return request received (${order._id})`,
            mailHtml: `<p>Return request received for ${order._id}. We'll update you shortly.</p>${itemsHtml}`,
            mailText: `Return request received for ${order._id}.\n\n${itemsText}`,
            smsTo: userPhone,
            smsBody: `${process.env.APP_NAME || "App"}: Return request received for order ${String(order._1).slice(-6)}.`,
          });
        }
      } catch (err) {
        console.warn("return notify err:", err);
      }
    })();

    const safe = order.toObject();
    if (safe.paymentVerification) {
      delete safe.paymentVerification.otp;
      delete safe.paymentVerification.otpExpires;
    }

    res.json({ success: true, message: "Return/refund request submitted", order: safe });
  } catch (err) {
    console.error("POST /return/:orderId error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Admin: Approve / Reject / Mark Collected for return/refund
 * PUT /api/orders/return/:orderId
 */
router.put("/return/:orderId", requiredSignIn, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body;
    if (!["Approved", "Rejected", "Collected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const order = await Order.findById(orderId).populate("items.product", "title images price").populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (!order.returnRefund) order.returnRefund = { status: "Not Requested" };

    if (action === "Approved") {
      order.returnRefund.status = "Approved";
      order.returnRefund.acceptedBy = req.user?.id || req.user?._id || null;
      order.returnRefund.acceptedAt = new Date();
      order.status = "Pending Pickup";
    } else if (action === "Rejected") {
      order.returnRefund.status = "Rejected";
    } else if (action === "Collected") {
      order.returnRefund.status = "Collected";
      order.returnRefund.collectedAt = new Date();
      order.status = "Collected";
    }

    await order.save();
    await order.populate("items.product", "title images price");
    await order.populate("user", "name email");

    // If collection is performed, restore stock (idempotent)
    if (action === "Collected") {
      try {
        await applyStockRestoreForOrder(order._id);
      } catch (stockErr) {
        console.warn("Stock restore after collection failed:", stockErr);
        // optional: you can choose to return an error here instead of warning
      }
    }

    (async () => {
      try {
        const userEmail = order.user?.email;
        const userPhone = order.address?.mobileNo;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;
        const itemsHtml = formatItemsHtml(order.items);
        if (action === "Approved") {
          await safeNotify({
            mailTo: userEmail,
            mailSubject: `[${process.env.APP_NAME || "App"}] Your return request approved (${order._id})`,
            mailHtml: `<p>Your return for ${order._1} is approved.</p>${itemsHtml}`,
            mailText: `Your return for ${order._id} is approved.`,
            smsTo: userPhone,
            smsBody: `${process.env.APP_NAME || "App"}: Return approved for order ${String(order._id).slice(-6)}.`,
          });
        } else if (action === "Rejected") {
          await safeNotify({
            mailTo: userEmail,
            mailSubject: `[${process.env.APP_NAME || "App"}] Your return request rejected (${order._id})`,
            mailHtml: `<p>Your return for ${order._id} was rejected.</p>${itemsHtml}`,
            mailText: `Your return for ${order._id} was rejected.`,
            smsTo: userPhone,
            smsBody: `${process.env.APP_NAME || "App"}: Return rejected for order ${String(order._id).slice(-6)}.`,
          });
        } else if (action === "Collected") {
          await safeNotify({
            mailTo: userEmail,
            mailSubject: `[${process.env.APP_NAME || "App"}] Return collected (${order._id})`,
            mailHtml: `<p>Pickup collected for ${order._id}.</p>${itemsHtml}`,
            mailText: `Pickup collected for ${order._id}.`,
            smsTo: userPhone,
            smsBody: `${process.env.APP_NAME || "App"}: Return collected for order ${String(order._id).slice(-6)}.`,
          });
        }

        await safeNotify({
          mailTo: adminEmail,
          mailSubject: `[${process.env.APP_NAME || "App"}] Return ${action} - ${order._id}`,
          mailHtml: `<p>Return ${action} for ${order._id}</p>`,
          mailText: `Return ${action} for ${order._id}`,
          smsTo: adminPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Return ${action} for ${String(order._id).slice(-6)}.`,
        });
      } catch (err) {
        console.warn("return action notify err:", err);
      }
    })();

    const safe = order.toObject();
    if (safe.paymentVerification) {
      delete safe.paymentVerification.otp;
      delete safe.paymentVerification.otpExpires;
    }

    res.json({ success: true, message: "Return/refund updated", order: safe });
  } catch (err) {
    console.error("PUT /return/:orderId error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Resend OTP for an order (authenticated owner or admin)
 * POST /api/orders/resend-otp/:orderId
 */
router.post("/resend-otp/:orderId", requiredSignIn, async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).json({ success: false, message: "Invalid order id" });

    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const requestingUserId = req.user?.id || req.user?._id;
    if (String(order.user) !== String(requestingUserId) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    order.paymentVerification = {
      method: order.paymentVerification?.method || "Both",
      otp,
      otpExpires,
      status: "Pending",
      verifiedAt: null,
    };
    await order.save();

    (async () => {
      try {
        const userEmail = order.user?.email || order.address?.email;
        const userPhone = order.address?.mobileNo;
        if (userEmail) {
          await safeNotify({
            mailTo: userEmail,
            mailSubject: `[${process.env.APP_NAME || "App"}] Your verification code for order ${order._id}`,
            mailHtml: otpMessageHtml(otp, 10),
            mailText: otpMessageText(otp, 10),
          });
        }
        if (userPhone) {
          await safeNotify({
            smsTo: userPhone,
            smsBody: `${process.env.APP_NAME || "App"}: ${otpMessageText(otp, 10)} Order: ${String(order._id).slice(-6)}`,
          });
        }
      } catch (err) {
        console.warn("resend otp notify err:", err);
      }
    })();

    res.json({ success: true, message: "OTP resent" });
  } catch (err) {
    console.error("POST /resend-otp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Public: send OTP for delivery to customer
 * POST /api/orders/public/:id/send-otp
 */
router.post("/public/:id/send-otp", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order id" });

    const order = await Order.findById(id).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    order.paymentVerification = {
      method: order.paymentVerification?.method || "Both",
      otp,
      otpExpires,
      status: "Pending",
      verifiedAt: null,
    };

    await order.save();

    (async () => {
      try {
        const userEmail = order.user?.email || order.address?.email;
        const userPhone = order.address?.mobileNo;
        const shortId = String(order._id).slice(-6);
        const subject = `[${process.env.APP_NAME || "App"}] Your delivery OTP for order ${shortId}`;
        const html = `<p>Your delivery OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
        const text = `Your delivery OTP is ${otp}. It expires in 10 minutes.`;
        const sms = `${process.env.APP_NAME || "App"}: OTP ${otp} for order ${shortId}. Expires in 10 min.`;

        await safeNotify({
          mailTo: userEmail,
          mailSubject: subject,
          mailHtml: html,
          mailText: text,
          smsTo: userPhone,
          smsBody: sms,
        });
      } catch (notifyErr) {
        console.warn("public send-otp notify err:", notifyErr);
      }
    })();

    const safe = order.toObject();
    if (safe.paymentVerification) {
      if (process.env.DEBUG === "true") {
        safe.paymentVerification._debugOtp = order.paymentVerification.otp;
      }
      delete safe.paymentVerification.otp;
      delete safe.paymentVerification.otpExpires;
    }

    res.json({ success: true, message: "OTP sent to customer (email/SMS) if available", order: safe });
  } catch (err) {
    console.error("POST /public/:id/send-otp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Public: verify OTP and mark delivered (atomic)
 * PUT /api/orders/public/:id/deliver
 * Body: { otp: "123456" }
 */
router.put("/public/:id/deliver", async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid order id" });
    if (!otp) return res.status(400).json({ success: false, message: "OTP required" });

    const now = new Date();

    const updated = await Order.findOneAndUpdate(
      {
        _id: id,
        "paymentVerification.otp": String(otp).trim(),
        "paymentVerification.otpExpires": { $gt: now }
      },
      {
        $set: {
          "paymentVerification.status": "Verified",
          "paymentVerification.verifiedAt": now,
          status: "Delivered",
          updatedAt: now
        }
      },
      { new: true }
    )
      .populate("items.product", "title name images price")
      .populate("user", "name email");

    if (!updated) {
      const order = await Order.findById(id).populate("user", "name email");
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      if (!order.paymentVerification || !order.paymentVerification.otp) {
        return res.status(400).json({
          success: false,
          message:
            "No OTP configured for this order. Use /api/orders/public/:id/send-otp to send one to the customer."
        });
      }
      if (order.paymentVerification.otpExpires && new Date() > new Date(order.paymentVerification.otpExpires)) {
        return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
      }
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const safe = updated.toObject();
    if (safe.paymentVerification) {
      delete safe.paymentVerification.otp;
      delete safe.paymentVerification.otpExpires;
    }

    // Attempt stock reduction after marking delivered
    try {
      await applyStockReductionForOrder(updated._id);
    } catch (stockErr) {
      console.warn("Stock reduction after public deliver failed:", stockErr);
      safe._stockWarning = stockErr.message;
    }

    (async () => {
      try {
        const shortId = String(updated._id).slice(-6);
        const userEmail = updated.user?.email || updated.address?.email;
        const userPhone = updated.address?.mobileNo;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;

        await safeNotify({
          mailTo: userEmail,
          mailSubject: `[${process.env.APP_NAME || "App"}] Your order ${shortId} delivered`,
          mailHtml: `<p>Your order <strong>${shortId}</strong> has been delivered.</p>`,
          mailText: `Your order ${shortId} has been delivered.`,
          smsTo: userPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
        });

        await safeNotify({
          mailTo: adminEmail,
          mailSubject: `[${process.env.APP_NAME || "App"}] Order ${shortId} delivered`,
          mailHtml: `<p>Order ${shortId} marked delivered via public deliver endpoint.</p>`,
          mailText: `Order ${shortId} delivered.`,
          smsTo: adminPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
        });
      } catch (nerr) {
        console.warn("public deliver notify err:", nerr);
      }
    })();

    return res.json({ success: true, message: "Order marked as delivered", order: safe });
  } catch (err) {
    console.error("PUT /public/:id/deliver error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------- PROTECTED deliver endpoint (for auth'ed users) ---------------------- */

/**
 * Mark delivered (protected) - atomic OTP verification for non-admins
 * PUT /api/orders/:orderId/deliver
 * Body: { otp?: "123456" } - admins bypass OTP
 */
router.put("/:orderId/deliver", requiredSignIn, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;
    const callerId = req.user?.id || req.user?._id;
    const isAdminUser = req.user?.role === "admin";

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    // Admins should be able to mark delivered without OTP.
    if (isAdminUser) {
      const updated = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status: "Delivered", updatedAt: new Date() } },
        { new: true }
      )
        .populate("items.product", "title name images price")
        .populate("user", "name email");

      if (!updated) return res.status(404).json({ success: false, message: "Order not found" });

      const safe = updated.toObject();
      if (safe.paymentVerification) {
        delete safe.paymentVerification.otp;
        delete safe.paymentVerification.otpExpires;
      }

      try {
        await applyStockReductionForOrder(updated._id);
      } catch (stockErr) {
        console.warn("Stock reduction after admin protected deliver failed:", stockErr);
        safe._stockWarning = stockErr.message;
      }

      return res.json({ success: true, message: "Order marked delivered by admin", order: safe });
    }

    // Non-admin: must be owner or courier
    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isOwner = String(order.user?._id || order.user) === String(callerId);
    const isCourier = req.user?.role === "courier";
    if (!isOwner && !isCourier) {
      return res.status(403).json({ success: false, message: "Not authorized to mark delivered" });
    }

    if (!order.paymentVerification || !order.paymentVerification.otp) {
      return res.status(400).json({ success: false, message: "No OTP configured for this order. Send OTP first." });
    }

    if (!otp) return res.status(400).json({ success: false, message: "OTP required" });

    const now = new Date();
    const updated = await Order.findOneAndUpdate(
      {
        _id: orderId,
        "paymentVerification.otp": String(otp).trim(),
        "paymentVerification.otpExpires": { $gt: now }
      },
      {
        $set: {
          "paymentVerification.status": "Verified",
          "paymentVerification.verifiedAt": now,
          status: "Delivered",
          updatedAt: now
        }
      },
      { new: true }
    )
      .populate("items.product", "title name images price")
      .populate("user", "name email");

    if (!updated) {
      const fresh = await Order.findById(orderId);
      if (!fresh.paymentVerification || !fresh.paymentVerification.otp) {
        return res.status(400).json({ success: false, message: "No OTP configured for this order. Send OTP first." });
      }
      if (fresh.paymentVerification.otpExpires && new Date() > new Date(fresh.paymentVerification.otpExpires)) {
        return res.status(400).json({ success: false, message: "OTP expired. Please resend and try again." });
      }
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const safe = updated.toObject();
    if (safe.paymentVerification) {
      delete safe.paymentVerification.otp;
      delete safe.paymentVerification.otpExpires;
    }

    try {
      await applyStockReductionForOrder(updated._id);
    } catch (stockErr) {
      console.warn("Stock reduction after protected deliver failed:", stockErr);
      safe._stockWarning = stockErr.message;
    }

    (async () => {
      try {
        const shortId = String(updated._id).slice(-6);
        const userEmail = updated.user?.email || updated.address?.email;
        const userPhone = updated.address?.mobileNo;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPhone = process.env.ADMIN_PHONE;

        await safeNotify({
          mailTo: userEmail,
          mailSubject: `[${process.env.APP_NAME || "App"}] Order delivered (${shortId})`,
          mailHtml: `<p>Your order <strong>${shortId}</strong> has been delivered.</p>`,
          mailText: `Order ${shortId} delivered.`,
          smsTo: userPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
        });

        await safeNotify({
          mailTo: adminEmail,
          mailSubject: `[${process.env.APP_NAME || "App"}] Order ${shortId} delivered`,
          mailHtml: `<p>Order ${shortId} has been delivered (marked by user/courier).</p>`,
          mailText: `Order ${shortId} delivered.`,
          smsTo: adminPhone,
          smsBody: `${process.env.APP_NAME || "App"}: Order ${shortId} delivered.`,
        });
      } catch (nerr) {
        console.warn("protected deliver notify err:", nerr);
      }
    })();

    return res.json({ success: true, message: "Order marked as delivered", order: safe });
  } catch (err) {
    console.error("PUT /:orderId/deliver error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get order by ID (owner or admin)
 * GET /api/orders/:id
 */
router.get("/:id", requiredSignIn, async (req, res) => {
  try {
    const param = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(param)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findById(param)
      .populate("items.product", "title name images price")
      .populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const requestingUserId = req.user?.id || req.user?._id;
    if (String(order.user._id) !== String(requestingUserId) && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const safe = order.toObject();
    if (safe.paymentVerification) {
      delete safe.paymentVerification.otp;
      delete safe.paymentVerification.otpExpires;
    }

    res.json({ success: true, order: safe });
  } catch (err) {
    console.error("GET /:id order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
