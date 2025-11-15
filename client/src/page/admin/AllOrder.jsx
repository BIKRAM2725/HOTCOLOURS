// src/page/AllOrder.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminNavbar from "../admin/AdminNavbar";
import OrderCard from "../../components/Order/OrderCard";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function AllOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [processingIds, setProcessingIds] = useState(new Set());
  const scrollRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile slide-over

  const getAuthHeaders = () => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed?.token) return { Authorization: `Bearer ${parsed.token}` };
    } catch (e) {
      /* ignore */
    }
    return {};
  };

  const sortNewestFirst = (arr) => {
    return (arr || []).slice().sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad; // newest first
    });
  };

  const fetchOrders = async (statusFilter = "All") => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const url =
        statusFilter === "All"
          ? `${API}/api/orders`
          : `${API}/api/orders?status=${encodeURIComponent(statusFilter)}`;

      const { data } = await axios.get(url, { headers });
      if (data?.success) {
        const sorted = sortNewestFirst(data.orders || []);
        setOrders(sorted);

        // scroll to top of list when new data arrives (so newest visible)
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      } else {
        toast.error(data?.message || "Failed to fetch orders");
        setOrders([]);
      }
    } catch (err) {
      console.error("fetchOrders error:", err?.response?.data || err.message || err);
      toast.error("Error fetching orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const headers = getAuthHeaders();
      const { data } = await axios.put(
        `${API}/api/orders/status/${orderId}`,
        { status: newStatus },
        { headers }
      );
      if (data?.success) {
        toast.success(`Order marked as ${newStatus}`);
        setOrders((prev) => {
          const updated = prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o));
          return sortNewestFirst(updated);
        });
      } else {
        toast.error(data?.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err?.response?.data || err.message);
      toast.error("Error updating status");
    }
  };

  const handleConfirmPickup = async (orderId) => {
    setProcessingIds((prev) => new Set(prev).add(orderId));
    const headers = getAuthHeaders();
    const prevOrders = [...orders];

    // optimistic update
    setOrders((prev) =>
      sortNewestFirst(
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: "Collected", returnRefund: { ...(o.returnRefund || {}), status: "Collected" } }
            : o
        )
      )
    );

    try {
      const { data } = await axios.put(
        `${API}/api/orders/return/${orderId}`,
        { action: "Collected" },
        { headers }
      );
      if (data?.success) {
        toast.success("Pickup confirmed (collected)");
        if (data.order) setOrders((prev) => sortNewestFirst(prev.map((o) => (o._id === orderId ? data.order : o))));
      } else {
        toast.error(data?.message || "Failed to confirm pickup");
        setOrders(prevOrders); // rollback
      }
    } catch (err) {
      console.error("Error confirming pickup:", err?.response?.data || err.message);
      toast.error("Error confirming pickup");
      setOrders(prevOrders); // rollback
    } finally {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(orderId);
        return s;
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
        <p className="text-lg font-medium text-gray-600">Loading orders...</p>
      </div>
    );

  // newest order id for badge
  const newestOrderId = orders.length ? orders[0]._id : null;

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex">
        {/* Sidebar for md+ */}
        <div className="hidden md:block">
          <AdminNavbar />
        </div>

        {/* Mobile slide-over for sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <aside className="fixed right-0 top-0 h-full w-[85%] max-w-xs bg-white z-50 shadow-lg overflow-auto">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="font-semibold">Admin Menu</div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              <div className="p-2">
                <AdminNavbar />
              </div>
            </aside>
          </>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          {/* Mobile header with menu toggle */}
          <div className="md:hidden mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-3 py-1 bg-white shadow rounded-md"
              aria-label="Open menu"
            >
              Menu
            </button>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-4 sm:p-6 max-w-6xl mx-auto border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>

              <div className="flex items-center gap-3">
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    fetchOrders(e.target.value);
                  }}
                  className="border border-gray-300 rounded-lg p-2 text-sm"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Pending Pickup">Pending Pickup</option>
                </select>
              </div>
            </div>

            {orders.length === 0 ? (
              <p className="text-center text-gray-500">No orders found.</p>
            ) : (
              <div
                ref={scrollRef}
                className="mt-4 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto pr-3 space-y-6"
              >
                {orders.map((order, i) => (
                  <div
                    key={order._id || i}
                    className="relative bg-white p-3 rounded-lg shadow-sm"
                  >
                    {/* NEW badge corrected and responsive */}
                    {order._id === newestOrderId && (
                      <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white z-10">
                        NEW
                      </span>
                    )}

                    <OrderCard order={order} index={i} onStatusUpdate={handleStatusUpdate} />

                    {order.status === "Pending Pickup" && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleConfirmPickup(order._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          disabled={processingIds.has(order._id)}
                        >
                          {processingIds.has(order._id) ? "Processing..." : "Confirm Pickup"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
