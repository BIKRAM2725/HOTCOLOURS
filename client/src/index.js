// src/index.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

import { UserProvider, useAuth } from "./context/UserContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

/**
 * Set axios default Authorization header from localStorage if token exists.
 * Do this before rendering the app so all initial requests include the header.
 */
(() => {
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {
    // swallow parse errors in case auth is corrupted
    console.warn("Failed to set axios auth header from localStorage", e);
  }
})();

function ProvidersWrapper() {
  // useAuth will work here because ProvidersWrapper is rendered INSIDE UserProvider
  const [auth] = useAuth();
  const userId = auth?.user?.id;
  return (
    <CartProvider userId={userId}>
      <App />
    </CartProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <ProvidersWrapper />
        <ToastContainer position="top-right" autoClose={3000} />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
