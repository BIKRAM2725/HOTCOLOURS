// src/context/CartContext.jsx (or wherever this file lives)
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// ✅ Use env var, fallback to localhost
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const CartProvider = ({ children, userId }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/cart/${userId}`);
      if (res.data.success) {
        setCart(res.data.cart || { items: [] });
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchCart();
  }, [userId, fetchCart]);

  const addToCart = async (product, quantity = 1) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/cart/add`, {
        userId,
        productId: product._id,
        quantity,
      });
      if (res.data.success) setCart(res.data.cart);
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!userId) return;
    try {
      const res = await axios.put(`${API_BASE}/api/cart/update`, {
        userId,
        productId,
        quantity,
      });
      if (res.data.success) setCart(res.data.cart);
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeFromCart = async (productId) => {
    if (!userId) return;
    try {
      const res = await axios.delete(`${API_BASE}/api/cart/remove`, {
        data: { userId, productId },
      });
      if (res.data.success) setCart(res.data.cart);
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  // Clear cart locally **and** on server
  const clearCart = async () => {
    if (!userId) return;
    try {
      await axios.delete(`${API_BASE}/api/cart/clear`, {
        data: { userId },
      });
      setCart({ items: [] });
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  const totalPrice = cart.items.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPrice,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
