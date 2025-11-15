// src/components/OrdersList.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const OrdersList = ({ userId, isAdmin }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const productCache = useRef({});

  useEffect(() => {
    const getOrders = async () => {
      try {
        setLoading(true);
        let res;
        const headers = getAuthHeader();
        if (isAdmin) {
          res = await axios.get(`${API}/api/orders`, {
            headers,
          });
        } else {
          if (!userId) {
            setOrders([]);
            setLoading(false);
            return;
          }
          res = await axios.get(`${API}/api/orders/user/${userId}`, {
            headers,
          });
        }

        if (res?.data?.success) {
          const normalized = await ensureProductsPopulated(res.data.orders || []);
          setOrders(normalized);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
        toast.error("Failed to load orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    getOrders();
  }, [userId, isAdmin]);

  function getAuthHeader() {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return {};
      const auth = JSON.parse(raw);
      const token = auth?.token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  async function ensureProductsPopulated(ordersList) {
    const toFetch = new Set();
    ordersList.forEach((order) => {
      (order.items || []).forEach((item) => {
        const prod = item.product;
        if (!prod) return;
        if (typeof prod === "string") toFetch.add(prod);
        else {
          const hasTitle = prod.title || prod.name;
          const hasImage =
            (prod.images && prod.images.length) || prod.image || prod.thumbnail;
          if (!hasTitle || !hasImage) {
            if (prod._id) toFetch.add(prod._id);
          }
        }
      });
    });

    toFetch.delete(null);

    const fetchPromises = [...toFetch].map(async (pid) => {
      if (!pid) return null;
      if (productCache.current[pid]) return productCache.current[pid];
      try {
        let resp = null;
        try {
          resp = await axios.get(`${API}/api/product/get-product/${pid}`);
        } catch (e) {
          resp = null;
        }
        if (!resp || !resp.data?.success) {
          try {
            resp = await axios.get(`${API}/api/post/get-post/${pid}`);
          } catch (e) {
            resp = null;
          }
        }
        const payload = resp?.data?.product || resp?.data?.post || resp?.data;
        if (payload) {
          productCache.current[pid] = payload;
          return payload;
        }
      } catch (err) {
        console.warn("Failed to fetch product", pid, err.message || err);
      }
      return null;
    });

    const fetched = await Promise.all(fetchPromises);
    fetched.forEach((p) => {
      if (p && (p._id || p.id)) productCache.current[p._id || p.id] = p;
    });

    const normalized = ordersList.map((order) => ({
      ...order,
      items: (order.items || []).map((item) => {
        const prod = item.product;
        if (!prod) return item;
        if (typeof prod === "string") {
          const p = productCache.current[prod];
          return { ...item, product: p || { _id: prod } };
        } else {
          const pid = prod._id || prod.id;
          if (pid && productCache.current[pid]) {
            return { ...item, product: productCache.current[pid] };
          }
          return item;
        }
      }),
    }));

    return normalized;
  }

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const headers = getAuthHeader();
      const res = await axios.put(
        `${API}/api/orders/cancel/${orderId}`,
        {},
        { headers }
      );

      if (res?.data?.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: "Cancelled" } : o
          )
        );
        toast.success("Order cancelled");
      } else {
        toast.error(res?.data?.message || "Failed to cancel");
      }
    } catch (err) {
      console.error("Cancel order error:", err.response?.data || err.message);
      toast.error("Error cancelling order");
    }
  };

  if (loading) return <p>Loading orders...</p>;
  if (!orders?.length) return <p>No orders found.</p>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {orders.map((order, idx) => (
        <div
          key={order._id || idx}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            marginBottom: 16,
            padding: 12,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div>
              <p style={{ margin: 0 }}>
                <strong>Order:</strong> #{String(order._id).slice(-6)}
              </p>
              <p style={{ margin: 0, color: "#6b7280" }}>
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt || Date.now()).toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0 }}>
                <strong>Total:</strong> ₹
                {order.total?.toLocaleString?.() ?? order.total}
              </p>
              <p style={{ margin: 0, color: "#6b7280" }}>
                <strong>Status:</strong> {order.status}
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {order.items.map((item, idy) => {
              const product = item.product || {};
              const title = product.title || product.name || "Untitled";
              const image =
                (product.images && product.images[0]) ||
                product.image ||
                product.thumbnail ||
                "/placeholder.jpg";
              return (
                <div
                  key={item._id || `${order._id}-${idy}`}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: 8,
                    borderRadius: 6,
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      flex: "0 0 84px",
                      overflow: "hidden",
                      borderRadius: 8,
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <img
                      src={image}
                      alt={title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
                    <div style={{ color: "#6b7280", marginTop: 6 }}>
                      Qty: {item.quantity} &nbsp; — &nbsp; ₹
                      {item.priceAtPurchase ??
                        item.price ??
                        product.price ??
                        "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {order.address && (
            <div style={{ marginTop: 12, color: "#374151" }}>
              <strong>Shipping Address:</strong>
              <div>
                {order.address.flatNo}, {order.address.localAddress}
              </div>
              <div>
                {order.address.city} —{" "}
                {order.address.pincode || order.address.pin}
              </div>
            </div>
          )}

          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            {["Pending", "Accepted"].includes(order.status) && (
              <button
                onClick={() => cancelOrder(order._id)}
                style={{
                  padding: "8px 12px",
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: 6,
                  border: "none",
                }}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrdersList;
