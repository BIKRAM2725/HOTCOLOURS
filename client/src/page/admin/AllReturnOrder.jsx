// src/page/AllReturnOrders.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminNavbar from "../admin/AdminNavbar";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function AllReturnOrders() {
  const [returnOrders, setReturnOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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
      // ignore parse error
    }
    return {};
  };

  const sortNewestFirst = (arr) =>
    (arr || []).slice().sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad;
    });

  // Fetch return/refund orders from backend
  const fetchReturnOrders = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const { data } = await axios.get(`${API}/api/orders/return-orders`, { headers });
      if (data?.success) {
        const sorted = sortNewestFirst(data.returnOrders || []);
        setReturnOrders(sorted);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      } else {
        toast.error(data?.message || "Failed to load return orders");
        setReturnOrders([]);
      }
    } catch (err) {
      console.error("fetchReturnOrders error:", err?.response?.data || err.message);
      toast.error("Error fetching return orders");
      setReturnOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnOrders();
    // eslint-disable-next-line
  }, []);

  // Handle Approve / Reject
  const handleRefundUpdate = async (orderId, approve) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(orderId));
      const headers = getAuthHeaders();

      // optimistic update
      const prev = [...returnOrders];
      setReturnOrders((prevOrders) =>
        sortNewestFirst(
          prevOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  returnRefund: {
                    ...order.returnRefund,
                    status: approve ? "Approved" : "Rejected",
                  },
                  status: approve ? "Pending Pickup" : order.status,
                }
              : order
          )
        )
      );

      const { data } = await axios.put(
        `${API}/api/orders/return/${orderId}`,
        { action: approve ? "Approved" : "Rejected" },
        { headers }
      );

      if (data?.success) {
        toast.success(`Refund ${approve ? "approved" : "rejected"}`);
        // if backend returned updated order, replace it
        if (data.order) {
          setReturnOrders((prevOrders) =>
            sortNewestFirst(prevOrders.map((o) => (o._id === orderId ? data.order : o)))
          );
        }
      } else {
        toast.error(data?.message || "Failed to update refund status");
        setReturnOrders(prev); // rollback
      }
    } catch (err) {
      console.error("handleRefundUpdate error:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "Error updating refund status");
      // rollback handled by finally if needed - but we kept prev snapshot above
    } finally {
      setProcessingIds((prev) => {
        const s = new Set(prev);
        s.delete(orderId);
        return s;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
        <p className="text-lg text-gray-600">Loading return/refund requests...</p>
      </div>
    );
  }

  const newestId = returnOrders.length ? returnOrders[0]._id : null;

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AdminNavbar />
        </div>

        {/* Mobile slide-over */}
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
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md hover:bg-gray-100" aria-label="Close menu">✕</button>
              </div>
              <div className="p-2">
                <AdminNavbar />
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          {/* Mobile header */}
          <div className="md:hidden mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Return / Refund Requests</h2>
            <button onClick={() => setSidebarOpen(true)} className="px-3 py-1 bg-white shadow rounded-md" aria-label="Open menu">
              Menu
            </button>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-4 sm:p-6 max-w-6xl mx-auto border border-gray-200">
            <h2 className="text-2xl font-bold text-center mb-4 hidden md:block">Return / Refund Requests</h2>

            {returnOrders.length === 0 ? (
              <p className="text-center text-gray-500">No return/refund requests.</p>
            ) : (
              <div ref={scrollRef} className="mt-4 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto pr-3 space-y-6">
                {returnOrders.map((order) => (
                  <article key={order._id} className="border p-4 rounded-lg shadow-sm flex flex-col gap-3 relative bg-white">
                    {/* NEW badge for newest */}
                    {order._id === newestId && (
                      <span className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white z-10">
                        NEW
                      </span>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          <strong>Order ID:</strong> {order._id}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>User:</strong> {order.user?.name} ({order.user?.email})
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Reason:</strong> {order.returnRefund?.reason || "—"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Request Status:</strong>{" "}
                          <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100">
                            {order.returnRefund?.status || "Requested"}
                          </span>
                        </p>
                      </div>

                      {/* summary badge */}
                      <div className="text-right">
                        {order.returnRefund?.status === "Approved" && (
                          <div className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                            Approved — Awaiting Pickup
                          </div>
                        )}
                        {order.returnRefund?.status === "Rejected" && (
                          <div className="text-sm font-semibold text-red-700 bg-red-50 px-2 py-1 rounded">
                            Rejected
                          </div>
                        )}
                        {order.returnRefund?.status === "Collected" && (
                          <div className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                            Collected
                          </div>
                        )}
                      </div>
                    </div>

                    {/* items with thumbnails */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.isArray(order.items) && order.items.length ? (
                        order.items.map((i) => {
                          const product = i.product || {};
                          const img =
                            (product.images && product.images[0]) ||
                            product.image ||
                            product.thumbnail ||
                            "/placeholder.jpg";
                          return (
                            <div key={i._id || `${order._id}-${product._id}`} className="flex items-center gap-3 border rounded p-2 bg-gray-50">
                              <img src={img} alt={product.title || product.name || "product"} className="w-16 h-16 rounded object-cover border" />
                              <div>
                                <div className="font-medium">{product.title || product.name || "Product"}</div>
                                <div className="text-sm text-gray-600">Qty: {i.quantity}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-gray-500">No items listed.</div>
                      )}
                    </div>

                    {/* action buttons */}
                    <div className="flex gap-2 mt-2">
                      {order.returnRefund?.status === "Requested" ? (
                        <>
                          <button
                            onClick={() => handleRefundUpdate(order._id, true)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            disabled={processingIds.has(order._id)}
                          >
                            {processingIds.has(order._id) ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleRefundUpdate(order._id, false)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            disabled={processingIds.has(order._id)}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-gray-600 italic">Actions not available for this request.</div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
