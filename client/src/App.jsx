
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/Navbar.jsx";

// Pages
import HomePage from "./page/HomePage.jsx";
import Login from "./page/Login.jsx";
import Register from "./page/Register.jsx";
import ProductDetails from "./page/ProductDetails.jsx";
import CategoryProducts from "./page/CategoryDetails.jsx";
import SearchResults from "./page/SearchResults.jsx";
import CartPage from "./page/CartPage.jsx";
import CheckOut from "./page/CheckOut.jsx";
import TrackOrder from "./page/TrackOrder.jsx";

// Admin Pages
import AdminDashBoard from "./page/admin/AdminDashBoard.jsx";
import CreatePost from "./page/admin/CreatePost.jsx";
import CreateCategory from "./page/admin/CreateCategory.jsx";
import AllReturnOrders from "./page/admin/AllReturnOrder.jsx";
import Activation from "./page/admin/Activation.jsx";
import AdminOrders from "./page/admin/AllOrder.jsx";

// User Pages
import UserDashBoard from "./page/user/UserDashBoard.jsx";
import UserOrders from "./page/user/UserOrders.jsx";

// Protected Routes
import PrivateRoutes from "./components/routes/Private.jsx";
import AdminRoutes from "./components/routes/Admin.jsx";
import Footer from "./components/Footer.jsx";

// src/App.jsx (top)
import Chatbot from "./components/Chatbot";



function App() {
  return (
    <>
  
      <NavBar />
      <Chatbot />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/category/:catId" element={<CategoryProducts />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckOut />} />
        <Route path="/track/:id" element={<TrackOrder />} />


        {/* User Protected Routes */}
        <Route path="/user" element={<PrivateRoutes />}>
          <Route index element={<UserDashBoard />} />
          <Route path="orders" element={<UserOrders />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminRoutes />}>
        <Route path="details" element={<AdminDashBoard />} />
          <Route index element={<AdminDashBoard />} />
          <Route path="item" element={<CreatePost />} />
          <Route path="create-category" element={<CreateCategory />} />
          <Route path="return-orders" element={<AllReturnOrders />} />
          <Route path="activation" element={<Activation />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
      </Routes>
      <Footer/>
    </>
  );
}



export default App;


