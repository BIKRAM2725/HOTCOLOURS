// UserOrders.jsx
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

    if (storedAuth?.user?.id) {
      fetchUserOrders(storedAuth.user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserOrders = async (uid) => {
    try {
      setLoading(true);
      // backend call using env var
      const res = await axios.get(`${API}/api/orders/user/${uid}`);
      if (res.data?.success) setOrders(res.data.orders || []);
    } catch (err) {
      console.error("fetchUserOrders:", err?.response?.data || err.message);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      const res = await axios.put(`${API}/api/orders/cancel/${orderId}`);
      if (res.data.success) {
        toast.success("Order cancelled successfully");
        setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), cancel: true } }));
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: "Cancelled" } : o)));
      }
    } catch (err) {
      console.error("handleCancel:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Failed to cancel order");
    }
  };

  const handleReturnSubmit = async (orderId) => {
    const { type, reason, upi } = returnData[orderId] || {};
    if (!type || !reason || (type === "Refund" && !upi)) {
      toast.warning("Please fill all required fields");
      return;
    }
    try {
      const res = await axios.post(`${API}/api/orders/return/${orderId}`, { type, reason, upi });
      if (res.data.success) {
        toast.success(`${type} request submitted`);
        setDisabledOrders((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), return: true } }));
        const updatedOrder = res.data.order || null;
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? updatedOrder || { ...o, returnRefund: { ...(o.returnRefund || {}), status: "Requested", requestType: type, reason, upi, requestDate: new Date().toISOString() } }
              : o
          )
        );
        setReturnData((prev) => ({ ...prev, [orderId]: {} }));
      } else {
        toast.error(res.data.message || "Failed to submit return/refund request");
      }
    } catch (err) {
      console.error("handleReturnSubmit:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Failed to submit return/refund request");
    }
  };

  const isReturnEligible = (order) => {
    if (order.status !== "Delivered") return false;
    const deliveredDate = new Date(order.updatedAt || order.createdAt);
    const now = new Date();
    const diffDays = (now - deliveredDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Desktop sidebar */}
      <aside className="hidden md:block">
        <UserNavbar />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        {/* ================================
            MOBILE HEADER + LEFT-SIDE MENU BUTTON
            (Mobile-specific code - visible on small screens)
            ================================ */}
        <div className="md:hidden sticky top-0 z-40 bg-white p-3 border-b flex items-center justify-between">
          <button
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <FaBars />
          </button>
          <div className="font-semibold">My Orders</div>
          <div className="w-8" /> {/* symmetry */}
        </div>

        {/* ================================
            LEFT-SIDE DRAWER (MOBILE-SPECIFIC)
            - Backdrop click closes drawer
            - Drawer slides from left (replaceable width via classes below)
            - NOTE: Mobile-specific code begins here
            ================================ */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer: change "w-[86%] max-w-xs" to "w-80" or "w-96" if you want fixed widths */}
            <aside
              className="fixed left-0 top-0 h-full z-50 transform translate-x-0 transition-transform duration-300 bg-white shadow-lg overflow-auto w-[86%] max-w-xs"
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
                {/* Render the same navbar inside the drawer */}
                <UserNavbar />
              </div>
            </aside>
          </>
        )}

        <h2 className="text-2xl font-bold text-center mb-6">My Orders</h2>

        {orders.length === 0 && <p className="text-center text-gray-500">No orders yet.</p>}

        {orders.map((order) => {
          const hasReturnRequested =
            order.returnRefund && order.returnRefund.status && order.returnRefund.status !== "Not Requested";
          const returnDisabled = disabledOrders[order._id]?.return || hasReturnRequested;

          return (
            <div key={order._id} className="bg-white p-5 rounded-xl shadow mb-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Order #{order._id.slice(-6)}</h3>
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

              <p className="text-sm text-gray-500 mb-2">Placed on: {new Date(order.createdAt).toLocaleString()}</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                {order.items.map((item) => {
                  const product = item.product || {};
                  const image = product?.images?.[0] || product?.image || product?.thumbnail || "/placeholder.jpg";
                  return (
                    <div key={item._id} className="flex items-center justify-between text-gray-700 mb-3">
                      <div className="flex items-center gap-3">
                        <img src={image} alt="product" className="w-12 h-12 rounded object-cover border" />
                        <span>{item.product?.title || "Product"} × {item.quantity}</span>
                      </div>
                      <span className="font-medium">₹{item.priceAtPurchase}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between font-medium mb-1">
                <span>Total:</span>
                <span>₹{order.total}</span>
              </div>

              <p className="text-sm text-gray-600">Payment Method: {order.paymentMethod}</p>

              <div className="flex flex-col gap-2 mt-3">
                {["Pending", "Accepted"].includes(order.status) && (
                  <button
                    onClick={() => handleCancel(order._id)}
                    disabled={disabledOrders[order._id]?.cancel}
                    className={`px-3 py-1 rounded text-white ${
                      disabledOrders[order._id]?.cancel ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {disabledOrders[order._id]?.cancel ? "Cancelled" : "Cancel Order"}
                  </button>
                )}

                {isReturnEligible(order) && !returnDisabled && (
                  <div className="flex flex-col gap-2 p-3 border border-gray-300 rounded-lg">
                    <select
                      value={returnData[order._id]?.type || ""}
                      onChange={(e) => setReturnData((prev) => ({ ...prev, [order._id]: { ...prev[order._id], type: e.target.value } }))}
                      className="border p-2 rounded"
                    >
                      <option value="">Select Type</option>
                      <option value="Refund">Refund</option>
                    </select>

                    <textarea
                      placeholder="Enter reason..."
                      value={returnData[order._id]?.reason || ""}
                      onChange={(e) => setReturnData((prev) => ({ ...prev, [order._id]: { ...prev[order._id], reason: e.target.value } }))}
                      className="border p-2 rounded"
                    />

                    {returnData[order._id]?.type === "Refund" && (
                      <input
                        type="text"
                        placeholder="Enter UPI ID"
                        value={returnData[order._id]?.upi || ""}
                        onChange={(e) => setReturnData((prev) => ({ ...prev, [order._id]: { ...prev[order._id], upi: e.target.value } }))}
                        className="border p-2 rounded"
                      />
                    )}

                    <button
                      onClick={() => handleReturnSubmit(order._id)}
                      disabled={disabledOrders[order._id]?.return}
                      className={`px-3 py-1 rounded text-white ${disabledOrders[order._id]?.return ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"}`}
                    >
                      {disabledOrders[order._id]?.return ? "Requested" : "Submit"}
                    </button>
                  </div>
                )}

                {isReturnEligible(order) && returnDisabled && (
                  <div className="p-3 border rounded-lg bg-yellow-50">
                    <div className="text-sm font-medium">Return/Refund Request: {order.returnRefund?.status || "Requested"}</div>
                    <div className="text-xs text-gray-600 mt-1">Type: {order.returnRefund?.requestType || "Refund"}</div>
                    <div className="text-xs mt-1">Reason: {order.returnRefund?.reason}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
