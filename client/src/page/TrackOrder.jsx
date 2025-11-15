import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Track() {
  const { id } = useParams(); // url /track/:id
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // new: email input for sending OTP (prefilled from order when available)
  const [emailToSend, setEmailToSend] = useState("");

  useEffect(() => {
    console.log("TRACK PAGE - API base:", API);
    fetchOrder();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
    // eslint-disable-next-line
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/orders/public/${id}`);
      if (res.data?.success) {
        setOrder(res.data.order);
        // prefill emailToSend if available in order (use user.email or address.email)
        const email = res.data.order?.user?.email || res.data.order?.address?.email || "";
        setEmailToSend(email);
      } else {
        toast.error(res.data?.message || "Order not found");
        setOrder(null);
      }
    } catch (err) {
      console.error("fetchOrder error:", err);
      toast.error("Order not found / server error");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Start a 60-second cooldown locally after sending OTP to avoid duplicate sends
  const startCooldown = (seconds = 60) => {
    setSendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setSendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!id) return;
    setSendingOtp(true);
    try {
      // send optional email in body so server can validate and send OTP specifically to that email
      const body = {};
      if (emailToSend && emailToSend.trim().length > 0) body.email = emailToSend.trim();

      const res = await axios.post(`${API}/api/orders/public/${id}/send-otp`, body);
      if (res.data?.success) {
        toast.success("OTP sent to customer (email / SMS) if available");
        setOtpSent(true);
        startCooldown(60);
        if (res.data.order) setOrder(res.data.order);
        else setTimeout(fetchOrder, 1200);
      } else {
        toast.error(res.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("send-otp error:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDeliver = async () => {
    if (!id) return;
    if (!otp || otp.trim().length === 0) {
      toast.error("Please enter the OTP received by the customer");
      return;
    }

    setVerifying(true);
    try {
      const res = await axios.put(`${API}/api/orders/public/${id}/deliver`, { otp: otp.trim() });
      if (res.data?.success) {
        toast.success("Order marked as delivered");
        setOtp("");
        setOtpSent(false);
        await fetchOrder();
      } else {
        toast.error(res.data?.message || "Failed to mark delivered");
      }
    } catch (err) {
      console.error("deliver error:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Failed to confirm delivery");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <ToastContainer position="top-right" autoClose={3000} />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <p className="text-gray-500 mb-4">Check the order ID or contact admin.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-800 text-white rounded">Go Back</button>
      </div>
    );
  }

  const productList = (order.items || []).map((it) => {
    const prod = it.product || {};
    return {
      title: prod.title || prod.name || "Product",
      qty: it.quantity || 0,
      price: it.priceAtPurchase ?? prod.price ?? 0,
      image: Array.isArray(prod.images) && prod.images.length ? prod.images[0] : null,
    };
  });

  // optional: mask email for display (e.g. a@***.com)
  const maskedEmail = (e) => {
    if (!e) return "";
    const [local, domain] = String(e).split("@");
    if (!local || !domain) return e;
    const maskedLocal = local.length <= 2 ? local[0] + "*" : local[0] + "*".repeat(Math.max(1, local.length - 2)) + local.slice(-1);
    const domainParts = domain.split(".");
    const maskedDomain = domainParts.length > 1 ? domainParts[0][0] + "*".repeat(Math.max(1, domainParts[0].length - 2)) + "." + domainParts.slice(1).join(".") : domain;
    return `${maskedLocal}@${maskedDomain}`;
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow rounded">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-bold mb-4 text-center">Track & Deliver Order</h1>

      <div className="mb-4">
        <p><strong>Order ID:</strong> {String(order._id).slice(-6)}</p>
        <p><strong>Status:</strong> <span className={`font-semibold ${order.status === "Delivered" ? "text-green-600" : "text-orange-600"}`}>{order.status}</span></p>
        <p><strong>Name:</strong> {order.address?.firstName} {order.address?.lastName}</p>
        <p><strong>Phone:</strong> {order.address?.mobileNo}</p>
        <p><strong>Address:</strong> {order.address?.localAddress}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
        <p><strong>Total:</strong> ₹{order.total}</p>
        <p className="text-sm text-gray-500 mt-1">Note: For security, OTP is not shown here. Use "Send OTP" to send to customer and then enter the code below.</p>
      </div>

      <div className="border-t pt-4 mb-4">
        <h3 className="font-semibold mb-2">Products</h3>
        <div className="space-y-3">
          {productList.map((p, idx) => (
            <div key={idx} className="flex items-center gap-4">
              {p.image ? (
                <img src={p.image} alt={p.title} className="w-20 h-20 object-cover rounded" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">No image</div>
              )}
              <div className="flex-1">
                <div className="font-medium">{p.title}</div>
                <div className="text-sm text-gray-600">Qty: {p.qty} • ₹{p.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Send OTP */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Send OTP to customer email (optional)</label>
          <div className="flex items-center gap-3">
            <input
              value={emailToSend}
              onChange={(e) => setEmailToSend(e.target.value)}
              placeholder={order.user?.email || order.address?.email ? maskedEmail(order.user?.email || order.address?.email) : "customer@example.com"}
              className="flex-1 border rounded px-3 py-2"
              disabled={order.status === "Delivered"}
            />
            <button
              onClick={handleSendOtp}
              disabled={sendingOtp || sendCooldown > 0 || order.status === "Delivered"}
              className={`px-4 py-2 rounded text-white ${sendCooldown > 0 || sendingOtp || order.status === "Delivered" ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {sendingOtp ? "Sending..." : sendCooldown > 0 ? `Send OTP (${sendCooldown}s)` : "Send OTP"}
            </button>
          </div>
          <div className="text-sm text-gray-600">Leave email blank to use the customer's saved email/phone on record.</div>
        </div>

        {/* OTP input + confirm */}
        <div className="flex gap-2 items-center">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP from customer"
            className="flex-1 border rounded px-3 py-2"
            disabled={order.status === "Delivered"}
          />
          <button
            onClick={handleDeliver}
            disabled={verifying || !otp || order.status === "Delivered"}
            className={`px-4 py-2 rounded text-white ${verifying || !otp || order.status === "Delivered" ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            {verifying ? "Verifying..." : "Confirm Delivery"}
          </button>
        </div>

        <div className="text-sm text-gray-500">
          If you receive "No OTP configured" error, press <strong>Send OTP</strong> first. OTPs expire in ~10 minutes.
        </div>

        {order.status === "Delivered" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
            This order is already marked as <strong>Delivered</strong>.
          </div>
        )}
      </div>
    </div>
  );
}
