// src/components/UserOrders.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNavbar from "./UserNavbar";
import { FaBars, FaTimes } from "react-icons/fa";

// Use CRA env var (fallback to localhost)
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnData, setReturnData] = useState({});
  const [disabledOrders, setDisabledOrders] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // mobile drawer state

  useEffect(() => {
    const storedAuth = (() => {
      try {
        return JSON.parse(localStorage.getItem("auth"));
      } catch {
        return null;
      }
    })();

    // Robust way to get user ID
    const uid = storedAuth?.user?._id || storedAuth?.user?.id || storedAuth?.user;
    if (uid) fetchUserOrders(uid);
    else setLoading(false);
  }, []);

  // Robust token reader (handles a few common shapes) - added for reliability
  const getAuthHeader = () => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return {};
      const auth = JSON.parse(raw);
      // common token fields
      const token =
        auth?.token ||
        auth?.accessToken ||
        auth?.authToken ||
        (auth?.data && (auth.data.token || auth.data.accessToken));
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const fetchUserOrders = async (uid) => {
    try {
      setLoading(true);
      const headers = getAuthHeader();
      const res = await axios.get(`${API}/api/orders/user/${uid}`, { headers });
      if (res.data?.success) {
        // Sort by creation date (latest first) for a better user experience
        const sorted = [...(res.data.orders || [])].sort(
          (a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
        );
        setOrders(sorted);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("fetchUserOrders:", err?.response?.data || err.message);
      toast.error("Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Using the original logic for cancel, ensuring Authorization header is sent
  const handleCancel = async (orderId) => {
    try {
      setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), cancelInFlight: true } }));
      const headers = getAuthHeader();
      const res = await axios.put(`${API}/api/orders/cancel/${orderId}`, {}, { headers });
      if (res.data.success) {
        toast.success("Order cancelled successfully");
        setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), cancel: true, cancelInFlight: false } }));
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: "Cancelled" } : o)));
      }
    } catch (err) {
      console.error("handleCancel:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Failed to cancel order");
      setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), cancelInFlight: false } }));
    }
  };

  // Using the original logic for return/refund, ensuring Authorization header is sent
  const handleReturnSubmit = async (orderId) => {
    const data = returnData[orderId] || {};
    const type = (data.type || "").trim();
    const reason = (data.reason || "").trim();
    const upi = (data.upi || "").trim();

    // validation
    if (!type || !reason || (type === "Refund" && !upi)) {
      toast.warning("Please fill all required fields");
      return;
    }

    setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), returnInFlight: true } }));

    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
         toast.error("You are not logged in. Please log in to request a return.");
         setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), returnInFlight: false } }));
         return;
      }

      const payload = { type, reason, upi };
      const res = await axios.post(`${API}/api/orders/return/${orderId}`, payload, { headers });

      if (res.data.success) {
        toast.success(`${type} request submitted`);
        setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), return: true, returnInFlight: false } }));

        const updatedOrder = res.data.order || null;
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? updatedOrder || {
                  ...o,
                  returnRefund: {
                    ...(o.returnRefund || {}),
                    status: "Requested",
                    requestType: type,
                    reason,
                    upi,
                    requestDate: new Date().toISOString(),
                  },
                }
              : o
          )
        );
        setReturnData((prev) => ({ ...prev, [orderId]: {} }));
      } else {
        toast.error(res.data.message || "Failed to submit return/refund request");
        setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), returnInFlight: false } }));
      }
    } catch (err) {
      console.error("handleReturnSubmit:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Failed to submit return/refund request");
      setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), returnInFlight: false } }));
    }
  };

  const isReturnEligible = (order) => {
    if (!order) return false;
    if (order.status !== "Delivered") return false;
    const diff =
      (new Date() - new Date(order.updatedAt || order.createdAt || 0)) /
      (1000 * 60 * 60 * 24);
    return diff <= 3; // 3-day return window
  };

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;

  return (
    // Set min-h-screen on the container
    <div className="flex min-h-screen bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Desktop sidebar */}
      <aside className="hidden md:block">
        <UserNavbar />
      </aside>

      {/* Main content - flex-1 ensures it fills remaining horizontal space.
          The height is handled by the overall flex container. 
          Use 'h-screen' and 'overflow-y-auto' on main for cleaner scrolling on smaller desktop views. */}
      <main className="flex-1 p-4 md:p-8 relative h-screen overflow-y-auto">

        {/* ================================
            MOBILE HEADER + LEFT-SIDE MENU BUTTON (Sticky for vertical scroll)
            ================================ */}
        <div className="md:hidden sticky top-0 z-40 bg-gray-100 p-3 border-b -mx-4 flex items-center justify-between">
          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <FaBars />
          </button>
          <div className="font-bold text-xl">My Orders</div>
          <div className="w-8" /> {/* symmetry */}
        </div>
        
        {/* Mobile Drawer (fixed positioning, handles its own height/scroll) */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <aside
              className="fixed left-0 top-0 h-full z-50 transform translate-x-0 transition-transform duration-300 bg-white shadow-lg overflow-y-auto w-[86%] max-w-xs"
              role="dialog"
              aria-modal="true"
              aria-label="User menu"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="font-semibold">Menu</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4">
                <UserNavbar />
              </div>
            </aside>
          </>
        )}

        {/* Page Title (Hidden on mobile if sticky header is present, shown on desktop) */}
        <h2 className="hidden md:block text-3xl font-bold text-center mb-6">My Orders</h2>
        
        {orders.length === 0 && <p className="text-center text-gray-500 mt-10 md:mt-0">No orders yet.</p>}

        {/* Orders List Container */}
        <div className="space-y-6 pt-4 md:pt-0">
          {orders.map((order) => {
            const oid = order._id || order.id;
            const hasReturnRequested =
              order.returnRefund && order.returnRefund.status && order.returnRefund.status !== "Not Requested";
            const returnDisabled = disabledOrders[oid]?.return || hasReturnRequested;

            return (
              <div key={oid} className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                
                {/* Order Header */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Order #{String(oid).slice(-6)}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-3">Placed on: {new Date(order.createdAt).toLocaleString()}</p>

                {/* Items List */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-3">
                  {order.items.map((item) => {
                    const product = item.product || {};
                    const image = product?.images?.[0] || product?.image || product?.thumbnail || "/placeholder.jpg";
                    return (
                      <div key={item._id} className="flex items-center justify-between text-gray-700">
                        <div className="flex items-center gap-3">
                          <img src={image} alt="product" className="w-12 h-12 rounded object-cover border" />
                          <div className="text-sm">
                            <p className="font-medium">{item.product?.title || "Product"}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-medium text-sm">₹{item.priceAtPurchase}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Total and Payment */}
                <div className="flex justify-between font-semibold mb-1">
                  <span>Total:</span>
                  <span>₹{order.total}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Payment Method: {order.paymentMethod}</p>

                {/* Action Buttons / Return UI */}
                <div className="flex flex-col gap-3">
                  {/* Cancel Button */}
                  {["Pending", "Accepted"].includes(order.status) && (
                    <button
                      onClick={() => handleCancel(oid)}
                      disabled={disabledOrders[oid]?.cancel || disabledOrders[oid]?.cancelInFlight}
                      className={`px-3 py-2 rounded text-white font-medium transition duration-150 ${
                        disabledOrders[oid]?.cancel || disabledOrders[oid]?.cancelInFlight 
                          ? "bg-gray-400 cursor-not-allowed" 
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {disabledOrders[oid]?.cancelInFlight ? "Cancelling..." : disabledOrders[oid]?.cancel ? "Cancelled" : "Cancel Order"}
                    </button>
                  )}

                  {/* Return Submission Form */}
                  {isReturnEligible(order) && !returnDisabled && (
                    <div className="flex flex-col gap-2 p-3 border border-gray-300 rounded-lg bg-yellow-50">
                      <select
                        value={returnData[oid]?.type || ""}
                        onChange={(e) => setReturnData((prev) => ({ ...prev, [oid]: { ...prev[oid], type: e.target.value } }))}
                        className="border p-2 rounded text-sm"
                      >
                        <option value="">Select Type</option>
                        <option value="Refund">Refund</option>
                        {/* <option value="Return">Return / Exchange</option> // Return/Exchange support added here if API supports it */}
                      </select>

                      <textarea
                        placeholder="Enter reason..."
                        value={returnData[oid]?.reason || ""}
                        onChange={(e) => setReturnData((prev) => ({ ...prev, [oid]: { ...prev[oid], reason: e.target.value } }))}
                        className="border p-2 rounded text-sm resize-none"
                        rows="2"
                      />

                      {returnData[oid]?.type === "Refund" && (
                        <input
                          type="text"
                          placeholder="Enter UPI ID (Required for Refund)"
                          value={returnData[oid]?.upi || ""}
                          onChange={(e) => setReturnData((prev) => ({ ...prev, [oid]: { ...prev[oid], upi: e.target.value } }))}
                          className="border p-2 rounded text-sm"
                        />
                      )}

                      <button
                        onClick={() => handleReturnSubmit(oid)}
                        disabled={disabledOrders[oid]?.returnInFlight}
                        className={`px-3 py-2 rounded text-white font-medium transition duration-150 ${
                          disabledOrders[oid]?.returnInFlight ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
                        }`}
                      >
                        {disabledOrders[oid]?.returnInFlight ? "Requesting..." : "Submit Return/Refund Request"}
                      </button>
                    </div>
                  )}

                  {/* Return Status Display */}
                  {isReturnEligible(order) && returnDisabled && (
                    <div className="p-3 border rounded-lg bg-yellow-100 border-yellow-300">
                      <div className="text-sm font-semibold text-yellow-800">Return/Refund Request Status: {order.returnRefund?.status || "Requested"}</div>
                      <div className="text-xs text-yellow-700 mt-1">Type: {order.returnRefund?.requestType || "Refund"}</div>
                      <div className="text-xs mt-1 text-gray-700">Reason: {order.returnRefund?.reason}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Adds padding at the bottom of the scrollable area */}
        <div className="h-4 md:h-10" />
      </main>
    </div>
  );
}