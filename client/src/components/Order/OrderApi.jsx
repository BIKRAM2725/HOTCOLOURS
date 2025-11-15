// src/Order/OrderApi.js
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL}/api/orders`;

// Read token from localStorage
function getAuthHeader() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token = parsed?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

// Admin — fetch all orders
export const fetchAllOrders = async () => {
  const headers = getAuthHeader();
  const { data } = await axios.get(API_BASE, { headers });
  return data;
};

// User — fetch user orders
export const fetchUserOrders = async (userId) => {
  const headers = getAuthHeader();
  const { data } = await axios.get(`${API_BASE}/user/${userId}`, { headers });
  return data;
};
