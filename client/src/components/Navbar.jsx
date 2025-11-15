// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaUserCircle, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import { IoHome } from "react-icons/io5";
import { AiFillFileUnknown } from "react-icons/ai";
import { MdContactSupport } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import logo from "../assets/logo (2).png";
import { useAuth } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";

/**
 * Responsive Navbar
 * - Desktop: horizontal nav (links visible + search)
 * - Mobile: hamburger => right-side slide-over drawer (accessible) which includes search
 */
export default function Navbar() {
  const navigate = useNavigate();
  const [auth, setAuth] = useAuth();
  const { cart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeBtnRef = useRef(null);
  const drawerRef = useRef(null);

  // Search state
  const [query, setQuery] = useState("");

  const user = auth?.user;
  const isSignIn = !!auth?.token;

  // total items in cart
  const cartCount = (cart?.items || []).reduce((s, it) => s + (it.quantity || 0), 0);

  // Lock body scroll while drawer open and focus management
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => closeBtnRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Close on ESC + trap focus
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && drawerOpen) setDrawerOpen(false);
      if (drawerOpen && e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const loginPage = () => {
    navigate("/login");
    closeDrawer();
  };

  const redirect = () => {
    if (!auth?.user) navigate("/login");
    else if (auth.user.role === "admin") navigate("/admin/details");
    else navigate("/user");
    closeDrawer();
  };

  const redirectToOrder = () => {
    if (!auth?.user) navigate("/login");
    else if (auth.user.role === "admin") navigate("/admin/orders");
    else navigate("/user/orders");
    closeDrawer();
  };

  const signOut = () => {
    localStorage.removeItem("auth");
    setAuth({ user: null, token: "" });
    closeDrawer();
    navigate("/");
  };

  const handleCartClick = (e) => {
    e?.preventDefault();
    if (!auth?.user) {
      navigate("/login");
      toast.error("Please sign in to access your cart.");
    } else {
      navigate("/cart");
    }
    closeDrawer();
  };

  // Search handlers
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const q = (query || "").trim();
    if (!q) {
      toast.info("Type something to search");
      return;
    }
    // navigate to search page, adjust query param name if needed
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
    closeDrawer();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${drawerOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* Drawer (slide-over) */}
      <aside
        ref={drawerRef}
        aria-hidden={!drawerOpen}
        className={`fixed right-0 top-0 z-40 h-full w-[320px] max-w-full bg-white shadow-xl transform transition-transform duration-300
          ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-label="Main menu"
      >
        <div className="flex items-center gap-3 bg-blue-600 text-white px-4 py-4">
          <FaUserCircle size={28} />
          <div className="font-semibold">{isSignIn ? `Hello, ${user?.name?.split(" ")[0]}` : "Welcome"}</div>
          <button
            ref={closeBtnRef}
            onClick={closeDrawer}
            aria-label="Close menu"
            className="ml-auto p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="p-4 space-y-3">
          {/* Search inside drawer (mobile) */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search products..."
              className="flex-1 h-10 px-3 rounded-md border border-slate-200 focus:outline-none"
              aria-label="Search products"
            />
            <button type="submit" className="h-10 w-10 flex items-center justify-center rounded-md bg-blue-600 text-white" aria-label="Search">
              <FiSearch />
            </button>
          </form>

          <button onClick={redirect} className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-2">
            <FaUser /> <span>Profile</span>
          </button>

          <button onClick={redirectToOrder} className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-2">
            <AiFillFileUnknown /> <span>Orders</span>
          </button>

          <button onClick={handleCartClick} className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-2"><FaShoppingCart /> Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex items-center justify-center bg-red-600 text-white text-xs w-6 h-6 rounded-full">{cartCount}</span>
            )}
          </button>

          <Link to="/" onClick={closeDrawer} className="block px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-2"><IoHome /> Home</Link>
          <Link to="/contact" onClick={closeDrawer} className="block px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-2"><MdContactSupport /> Contact</Link>
          <Link to="/about" onClick={closeDrawer} className="block px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-2"><AiFillFileUnknown /> About</Link>

          <div className="border-t mt-2 pt-3">
            {isSignIn ? (
              <button onClick={signOut} className="w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50 flex items-center gap-2">
                <FaTimes /> Sign out
              </button>
            ) : (
              <button onClick={loginPage} className="w-full text-left px-3 py-2 rounded-md text-green-600 hover:bg-green-50 flex items-center gap-2">
                <FaUser /> Sign in
              </button>
            )}
          </div>
        </nav>
      </aside>

      {/* Top navigation */}
      <nav className="flex items-center h-[64px] w-full max-w-[1200px] mx-auto justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Hotcolours" className="w-11 h-11 rounded-full object-cover shadow-sm border border-orange-200" />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-lg font-extrabold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">Hotcolours</span>
              <span className="text-xs text-gray-500">Spices & More</span>
            </div>
          </Link>
        </div>

        {/* Desktop links + search (md+) */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-6 text-slate-700 font-semibold">
            <Link to="/" className="flex items-center gap-2 hover:text-slate-900"><IoHome /> Home</Link>
            <Link to="/contact" className="flex items-center gap-2 hover:text-slate-900"><MdContactSupport /> Contact</Link>
            <Link to="/about" className="flex items-center gap-2 hover:text-slate-900"><AiFillFileUnknown /> About</Link>
          </div>

          {/* SEARCH BOX (desktop) */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-slate-200 px-2 py-1">
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-9 px-2 w-[420px] max-w-[420px] focus:outline-none text-sm"
              aria-label="Search products"
            />
            <button type="submit" className="h-9 w-9 flex items-center justify-center rounded-md bg-blue-600 text-white" aria-label="Search">
              <FiSearch />
            </button>
          </form>
        </div>

        {/* Right-side: desktop profile icon, mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop profile icon */}
          <button
            onClick={() => {
              if (isSignIn) redirect();
              else setDrawerOpen(true);
            }}
            className="hidden md:inline-flex items-center gap-2 text-slate-600 hover:text-slate-800"
            title={isSignIn ? user?.name : "Profile"}
            aria-label="Profile"
          >
            <FaUser />
          </button>

          {/* Cart - visible on desktop */}
          <button onClick={handleCartClick} className="hidden md:inline-flex relative items-center gap-2 text-slate-600 hover:text-slate-800">
            <FaShoppingCart />
            <span className="hidden md:inline">Cart</span>
            {cartCount > 0 && <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>}
          </button>

          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            onClick={openDrawer}
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          >
            <FaBars />
          </button>
        </div>
      </nav>
    </>
  );
}
