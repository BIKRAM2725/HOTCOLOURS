// src/page/OrdersPage.jsx
import React from "react";
import OrdersList from "../components/OrdersList";
import { useAuth } from "../context/UserContext";

const OrdersPage = () => {
  const [auth] = useAuth();
  const userId = auth?.user?._id || auth?.user?.id || ""; // adapt if your auth shape differs
  const isAdmin = auth?.user?.role === "admin";

  return (
    <div style={{ padding: "20px" }}>
      <OrdersList userId={userId} isAdmin={isAdmin} />
    </div>
  );
};

export default OrdersPage;
