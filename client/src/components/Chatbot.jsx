// src/components/Chatbot.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  FiX,
  FiPhone,
  FiList,
  FiClock,
  FiChevronLeft,
  FiUser,
  FiSend,
  FiShoppingCart,
  FiLogOut,
  FiSettings,
  FiChevronRight
} from "react-icons/fi";
import { FaRobot, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext";
import axios from "axios";

// --- FALLBACK REPLIES ---
const replies = {
  contactLaunched: () => ({ type: "bot", message: "Launching WhatsApp in a new window...", view: "navigate" }),
  needLoginForOrders: () => ({ type: "bot", message: "Please log in to view your orders.", view: "orders" }),
  fetchingRecentOrders: (count) => ({ type: "bot", message: `Fetching your last ${count} orders...`, view: "loading" }),
  recentOrdersFound: (count) => ({ type: "bot", message: count > 0 ? "Here are your recent orders:" : "You have no recent orders.", view: "orders" }),
  ordersFetchError: () => ({ type: "bot", message: "Error fetching orders. Please try again later.", view: "orders" }),
  confirmCancelPrompt: (id) => ({ type: "bot", message: `Are you sure you want to cancel order #${String(id).slice(-6)}? Click YES below to confirm.`, view: "orders" }),
  cancelSuccess: (id) => ({ type: "bot", message: `Order #${String(id).slice(-6)} cancelled successfully.`, view: "orders" }),
  cancelFailed: (id) => ({ type: "bot", message: `Failed to cancel order #${String(id).slice(-6)}.`, view: "orders" }),
  returnRequestSubmitting: (id) => ({ type: "bot", message: `Submitting return request for order #${String(id).slice(-6)}...`, view: "orders" }),
  returnRequestSuccess: (id, type) => ({ type: "bot", message: `${type} request for order #${String(id).slice(-6)} submitted successfully.`, view: "orders" }),
  returnRequestFailed: (id) => ({ type: "bot", message: `Failed to submit return request for order #${String(id).slice(-6)}.`, view: "orders" }),
  categoriesLoading: () => ({ type: "bot", message: "Loading product categories...", view: "loading" }),
  categoriesLoaded: () => ({ type: "bot", message: "Which category are you interested in?", view: "categories" }),
  subcategoriesLoaded: (catName) => ({ type: "bot", message: `Here are the topics in ${catName}:`, view: "subcategories" }),
 
};
// --- END FALLBACK REPLIES ---

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const WHATSAPP = process.env.REACT_APP_WHATSAPP_NUMBER || "+918337882902";

const GRADIENT_BG = "bg-gradient-to-r from-orange-500 to-red-500";
const BOT_NAME = "HotBot Assistant";
const PRIMARY_COLOR = "orange-600";

const BotIcon = ({ className = "w-6 h-6", colorClass = "text-white" }) => (
  <FaRobot className={`${className} ${colorClass}`} />
);

const ChatBubble = ({ children, onClick, icon: Icon, className = "" }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 text-left text-sm font-medium hover:bg-gray-100 transition shadow-sm ${className}`}
  >
    {Icon && <Icon className={`text-${PRIMARY_COLOR}`} />}
    {children}
    <FiChevronRight className="ml-auto text-gray-400" />
  </button>
);

const BotReply = ({ children }) => (
  <div className="flex justify-start mb-3">
    <div className="p-3 rounded-xl rounded-bl-sm bg-gray-200 text-gray-800 max-w-[85%]">
      {children}
    </div>
  </div>
);

const UserMessage = ({ children }) => (
  <div className="flex justify-end mb-3">
    <div className="p-3 rounded-xl rounded-br-sm bg-gradient-to-r from-orange-500 to-red-500 text-white max-w-[85%]">
      {children}
    </div>
  </div>
);

const fmtDateShort = (iso) => {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso || "";
  }
};

function getAuthHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const apiCancelOrder = async (orderId, token) => {
  const headers = getAuthHeader(token);
  try {
    const res = await axios.put(`${API_BASE}/api/orders/cancel/${orderId}`, {}, { headers });
    return res.data;
  } catch (e) {
    return { success: false, message: e.response?.data?.message || "Cancellation failed." };
  }
};
const apiSubmitReturn = async (orderId, payload, token) => {
  const headers = getAuthHeader(token);
  try {
    const res = await axios.post(`${API_BASE}/api/orders/return/${orderId}`, payload, { headers });
    return res.data;
  } catch (e) {
    return { success: false, message: e.response?.data?.message || "Submission failed." };
  }
};

export default function Chatbot() {
  const [open, setOpen] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chatbot_open")) || false;
    } catch {
      return false;
    }
  });

  const [step, setStep] = useState("menu");
  const [history, setHistory] = useState([
    { type: "bot", message: "Welcome to Hotcolours! I'm HotBot, your quick assistant.", view: "menu" },
  ]);

  const [categories, setCategories] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");

  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [returnPanel, setReturnPanel] = useState({ open: false, orderId: null, type: "Refund", reason: "", upi: "", submitting: false });

  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [history, step, orders, orderLoading, cancelingOrderId, returnPanel.open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem("chatbot_open", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const goBack = () => {
    let prevStep = "menu";
    if (step === "subcategories") prevStep = "categories";
    setStep(prevStep);
    setHistory((h) => [...h, { type: "bot", message: "Ready for the next task.", view: prevStep }]);
    setCancelingOrderId(null);
    setReturnPanel({ open: false, orderId: null, type: "Refund", reason: "", upi: "", submitting: false });
  };

  const handleAction = (userMsg, nextStep, actionFn) => {
    setHistory((h) => [...h, { type: "user", message: userMsg }]);
    setStep(nextStep);
    actionFn?.();
  };

  const handleLogout = () => {
    handleAction("Logout", "menu", () => {
      setAuth({ user: null, token: "" });
      localStorage.removeItem("auth");
      setHistory((h) => [...h, { type: "bot", message: "You have been logged out. Visit us again soon!", view: "menu" }]);
      navigate("/");
      setOpen(false);
    });
  };

  const goToCart = () => {
    handleAction("View Cart / Checkout", "menu", () => {
      setHistory((h) => [...h, { type: "bot", message: "Redirecting you to your shopping cart.", view: "navigate" }]);
      navigate(`/cart`);
      setOpen(false);
    });
  };

  const handleContact = () => {
    handleAction("Contact / WhatsApp", "menu", () => {
      setHistory((h) => [...h, { type: "bot", message: "Launching WhatsApp in a new window. We are ready to chat!", view: "navigate" }]);
      const message = encodeURIComponent("Hello Hotcolours! I need help.");
      const url = `https://wa.me/${WHATSAPP.replace(/^\+/, "")}?text=${message}`;
      window.open(url, "_blank");
      setOpen(false);
    });
  };

  // --- Categories (in-chat complete flow) ---
  const loadCategories = async () => {
    setLoading(true);
    setHistory((h) => [...h, replies.categoriesLoading()]);
    try {
      const res = await axios.get(`${API_BASE}/api/category/get-category`);
      const cats = res.data?.categories || res.data?.data || res.data || [];
      setCategories(Array.isArray(cats) ? cats : []);
      setHistory((h) => [...h, replies.categoriesLoaded()]);
      setStep("categories");
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setHistory((h) => [...h, { type: "bot", message: "Oops! Could not load categories right now. Try the main website.", view: "menu" }]);
      setStep("menu");
    } finally {
      setLoading(false);
    }
  };

  const openCategory = async (cat) => {
    setHistory((h) => [...h, { type: "user", message: cat.name || cat }]);
    setStep("subcategories");

    if (cat?.subcategories?.length) {
      setSelectedCategory(cat);
      setSubcats(cat.subcategories);
      setHistory((h) => [...h, replies.subcategoriesLoaded(cat.name || "")]);
      return;
    }

    setLoading(true);
    setHistory((h) => [...h, { type: "bot", message: `Searching for subcategories in ${cat.name || "this category"}...`, view: "loading" }]);

    try {
      const res = await axios.get(`${API_BASE}/api/category/${cat._id}`);
      const sc = res.data?.subcategories || res.data?.children || [];
      if (Array.isArray(sc) && sc.length > 0) {
        setSelectedCategory(cat);
        setSubcats(sc);
        setHistory((h) => [...h, replies.subcategoriesLoaded(cat.name || "")]);
      } else {
        // fallback to navigate to category page if none found
        navigate(`/category/${cat._id}`);
        setOpen(false);
      }
    } catch (err) {
      console.error("Error fetching category details", err);
      navigate(`/category/${cat._id}`);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategoryClick = (sub) => {
    const name = sub.name || sub;
    const id = sub._id || sub.id || sub.categoryId || null;
    setHistory((h) => [...h, { type: "user", message: name }]);
    setHistory((h) => [...h, { type: "bot", message: `Navigating to the ${name} product listing...`, view: "navigate" }]);
    if (id) navigate(`/category/${id}`);
    else if (sub.link) navigate(sub.link);
    else navigate(`/category/${selectedCategory?._id}`);
    setOpen(false);
  };

  // --- Orders (unchanged) ---
  const loadOrders = async () => {
    handleAction("Recent Order Status", "orders", null);
    setOrderError("");
    setOrders([]);

    if (!auth?.token || !auth?.user) {
      setOrderError("Please log in to view your orders.");
      setOrders([]);
      setStep("orders");
      setHistory((h) => [...h, replies.needLoginForOrders()]);
      return;
    }

    setOrderLoading(true);
    setHistory((h) => [...h, replies.fetchingRecentOrders(5)]);

    try {
      const uid = auth.user._id || auth.user.id || auth.user;
      const token = auth.token;
      const headers = getAuthHeader(token);
      let res;
      try {
        res = await axios.get(`${API_BASE}/api/orders/user/${uid}`, { headers });
      } catch (err) {
        res = await axios.get(`${API_BASE}/api/orders`, { headers, params: { userId: uid } });
      }
      const orderData = res.data?.orders || res.data?.data || res.data || [];
      const list = Array.isArray(orderData) ? orderData : [];
      list.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setOrders(list.slice(0, 5));
      setStep("orders");
      setHistory((h) => [...h, replies.recentOrdersFound(list.length)]);
    } catch (err) {
      console.error("Order Fetch Error:", err);
      setOrderError("Unable to fetch orders. Please ensure you are logged in correctly.");
      setOrders([]);
      setStep("orders");
      setHistory((h) => [...h, replies.ordersFetchError()]);
    } finally {
      setOrderLoading(false);
    }
  };

  

  const confirmCancelNow = async (orderId) => {
    setCancelingOrderId(orderId);
    setHistory((h) => [...h, { type: "bot", message: `Cancelling order #${String(orderId).slice(-6)}...`, view: "loading" }]);
    const token = auth.token;
    try {
      const res = await apiCancelOrder(orderId, token);
      if (res?.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: "Cancelled" } : o)));
        setHistory((h) => [...h, replies.cancelSuccess(orderId)]);
      } else {
        setHistory((h) => [...h, replies.cancelFailed(orderId)]);
      }
    } catch (err) {
      setHistory((h) => [...h, replies.cancelFailed(orderId)]);
    } finally {
      setCancelingOrderId(null);
    }
  };

  const submitReturnFromChat = async () => {
    const { orderId, type, reason, upi } = returnPanel;
    if (!type || !reason || (type === "Refund" && !upi)) {
      setHistory((h) => [...h, { type: "bot", message: "Please fill required fields before submitting the return/refund.", view: "orders" }]);
      return;
    }
    setReturnPanel((r) => ({ ...r, submitting: true }));
    setHistory((h) => [...h, replies.returnRequestSubmitting(orderId)]);
    const token = auth.token;
    try {
      const payload = { type, reason, upi };
      const res = await apiSubmitReturn(orderId, payload, token);
      if (res?.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, returnRefund: { ...(o.returnRefund || {}), status: "Requested", requestType: type, reason, upi } } : o)));
        setHistory((h) => [...h, replies.returnRequestSuccess(orderId, type)]);
        setReturnPanel({ open: false, orderId: null, type: "Refund", reason: "", upi: "", submitting: false });
      } else {
        setHistory((h) => [...h, replies.returnRequestFailed(orderId)]);
        setReturnPanel((r) => ({ ...r, submitting: false }));
      }
    } catch (err) {
      setHistory((h) => [...h, replies.returnRequestFailed(orderId)]);
      setReturnPanel((r) => ({ ...r, submitting: false }));
    }
  };

  const handleCancelFromChat = async (orderId) => {
    setCancelingOrderId(orderId);
    setHistory((h) => [...h, replies.confirmCancelPrompt(orderId)]);
  };
  const openReturnPanel = (orderId) => {
    setReturnPanel({ open: true, orderId, type: "Refund", reason: "", upi: "", submitting: false });
    setHistory((h) => [...h, { type: "bot", message: `Opening return/refund form for order #${String(orderId).slice(-6)}.`, view: "orders" }]);
  };

  // --- Render panels ---
  const Menu = () => (
    <div className="p-4 space-y-3">
      <BotReply>What can I help you with today? Choose an option below.</BotReply>

      <ChatBubble onClick={handleContact} icon={FiPhone} className={`${GRADIENT_BG} text-white font-semibold border-0`}>
        Contact / WhatsApp
      </ChatBubble>

      {auth?.user ? (
        <>
          {/* Account & Settings stays in-chat */}
          <ChatBubble onClick={() => handleAction("Open Account Menu", "account", null)} icon={FiUser}>
            Account & Settings
          </ChatBubble>

          {/* Orders stays as the in-chat fetch */}
          <ChatBubble onClick={loadOrders} icon={FiClock}>
            Recent Order Status
          </ChatBubble>
        </>
      ) : (
        <ChatBubble onClick={() => { navigate("/login"); setOpen(false); }} icon={FiUser} className="bg-blue-100 hover:bg-blue-200">
          Log In / Sign Up
        </ChatBubble>
      )}

      {/* Browse Categories is the full in-chat flow */}
      <ChatBubble onClick={loadCategories} icon={FiList}>
        Browse Categories
      </ChatBubble>

      <ChatBubble onClick={goToCart} icon={FiShoppingCart}>
        View Cart / Checkout
      </ChatBubble>

      <button onClick={() => { navigate("/help"); setOpen(false); }} className="text-left text-sm text-gray-600 hover:text-blue-600 transition pt-2 block w-full">
        &rarr; Go to full Help Center / FAQ
      </button>
    </div>
  );

  const CategoriesView = () => (
    <div className="p-4 space-y-3">
      {loading ? (
        <div className="text-sm text-center py-4">Loading categories...</div>
      ) : categories.length === 0 ? (
        <BotReply>I'm having trouble finding the categories. Please check back later.</BotReply>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
          {categories.map((cat) => (
            <button key={cat._id || cat.id || cat.name} onClick={() => openCategory(cat)} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-center text-sm font-medium hover:bg-gray-50 transition transform hover:scale-[1.02] active:scale-100">
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const SubcategoriesView = () => (
    <div className="p-4 space-y-3">
      {loading ? (
        <div className="text-sm text-center py-4">Loading details...</div>
      ) : subcats.length === 0 ? (
        <BotReply>I don't see any specific subtopics here. I recommend checking the main category page for all products.</BotReply>
      ) : (
        <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
          {subcats.map((s) => (
            <ChatBubble key={s._id || s.id || s.name} onClick={() => handleSubcategoryClick(s)}>
              {s.name || s}
            </ChatBubble>
          ))}
        </div>
      )}
    </div>
  );

  const OrdersView = () => (
    <div className="p-4 space-y-3">
      {orderLoading ? (
        <div className="text-sm text-center py-4">Loading recent orders...</div>
      ) : orderError ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm rounded">{orderError}</div>
      ) : orders.length === 0 ? (
        <BotReply>I couldn't find any recent orders in your account. Have you placed one yet?</BotReply>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {orders.map((o) => (
            <div key={o._id || o.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Order #{(o._id || o.id).toString().slice(-6)}</div>
                  <div className={`text-xs font-semibold ${o.status?.toLowerCase().includes("delivered") ? "text-green-600" : o.status?.toLowerCase().includes("processing") ? "text-blue-600" : "text-gray-500"}`}>
                    {o.status || o.orderStatus || "Processing"}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-sm font-medium">₹{o.total}</div>
                  <div className="text-xs text-gray-400 mt-1">{fmtDateShort(o.createdAt || o.date)}</div>
                </div>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">


                {["Pending", "Accepted"].includes(o.status) && (
                  <>
                    <button onClick={() => handleCancelFromChat(o._id)} className="text-red-600 font-medium text-sm p-1 rounded hover:bg-red-50">Cancel</button>
                    {cancelingOrderId === o._id && (
                      <div className="flex items-center gap-2 border p-1 rounded bg-red-50">
                        <span className="text-xs text-gray-700">Confirm?</span>
                        <button onClick={() => confirmCancelNow(o._id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Yes</button>
                        <button onClick={() => setCancelingOrderId(null)} className="px-2 py-1 border rounded text-xs">No</button>
                      </div>
                    )}
                  </>
                )}

                {(o.status === "Delivered") && !o.returnRefund?.status && (
                  <button onClick={() => openReturnPanel(o._id)} className="text-yellow-600 font-medium text-sm p-1 rounded hover:bg-yellow-50">Return / Refund</button>
                )}
              </div>

              {o.returnRefund?.status && (
                <div className="mt-2 text-xs text-gray-600 p-2 border rounded bg-yellow-50">
                  Return: <span className="font-medium">{o.returnRefund.status}</span> — {o.returnRefund.requestType}
                </div>
              )}
            </div>
          ))}

          <button onClick={() => { navigate("/user/orders"); setOpen(false); }} className="text-sm text-blue-600 hover:text-blue-800 block w-full text-center pt-2">
            View All Orders
          </button>
        </div>
      )}

      {returnPanel.open && (
        <div className="mt-3 p-3 border rounded bg-white shadow-md">
          <div className="text-sm font-medium mb-2">Return / Refund — Order #{String(returnPanel.orderId).slice(-6)}</div>

          <select value={returnPanel.type} onChange={(e) => setReturnPanel((r) => ({ ...r, type: e.target.value }))} className="border p-2 rounded w-full mb-2 text-sm">
            <option value="Refund">Refund</option>
            <option value="Return">Return / Exchange</option>
          </select>

          <textarea placeholder="Reason" value={returnPanel.reason} onChange={(e) => setReturnPanel((r) => ({ ...r, reason: e.target.value }))} className="border p-2 rounded w-full mb-2 text-sm" rows="2" />

          {returnPanel.type === "Refund" && (
            <input placeholder="UPI ID (for refund)" value={returnPanel.upi} onChange={(e) => setReturnPanel((r) => ({ ...r, upi: e.target.value }))} className="border p-2 rounded w-full mb-2 text-sm" />
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setReturnPanel({ open: false, orderId: null, type: "Refund", reason: "", upi: "", submitting: false })} className="px-3 py-1 rounded border text-sm">Cancel</button>
            <button onClick={submitReturnFromChat} disabled={returnPanel.submitting} className="px-3 py-1 rounded bg-yellow-500 text-white text-sm">
              {returnPanel.submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const AccountView = () => (
    <div className="p-4 space-y-4">
      <BotReply>Welcome to your account dashboard! What would you like to do?</BotReply>

      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
        <FaUserCircle className="text-3xl text-orange-600" />
        <div>
          <div className="font-bold text-gray-800">{auth?.user?.name || "Guest"}</div>
          <div className="text-xs text-gray-500">{auth?.user?.email}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* In-chat Profile & Settings: stays in chat but navigates to profile page if user chooses full profile */}
        <button onClick={() => { /* open small in-chat profile or navigate as needed */ navigate("/user"); setOpen(false); }} className="p-3 bg-white border border-gray-200 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
          <FiSettings size={16} /> Profile Details
        </button>

        <button onClick={() => { navigate("/subscriptions"); setOpen(false); }} className="p-3 bg-white border border-gray-200 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
          <FiList size={16} /> Subscriptions
        </button>

        <button onClick={handleLogout} className="p-3 bg-red-500 text-white border-red-600 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-red-600 col-span-2">
          <FiLogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );

  const renderCurrentContent = () => {
    if (step === "menu") return <Menu />;
    if (step === "categories") return <CategoriesView />;
    if (step === "subcategories") return <SubcategoriesView />;
    if (step === "orders") return <OrdersView />;
    if (step === "account") return <AccountView />;
    return <div className="p-4 text-gray-500">Loading...</div>;
  };

  return (
    <>
      <div className="fixed right-5 bottom-6 z-50">
        <button onClick={toggle} aria-expanded={open} aria-label={open ? "Close chat" : "Open chat"} className={`${GRADIENT_BG} text-white p-4 rounded-full shadow-xl flex items-center justify-center border-4 border-white transition-all duration-300 ease-in-out transform hover:scale-105`}>
          <span className="sr-only">Chat</span>
          {open ? <FiX size={24} /> : <BotIcon className="w-6 h-6" colorClass="text-white" />}
        </button>
      </div>

      <div id="chatbot-panel" className={`fixed right-2 sm:right-5 bottom-[98px] z-50 w-[94vw] sm:w-[380px] max-h-[75vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`} role="dialog" aria-label={BOT_NAME}>

        <div className={`flex items-center gap-3 p-4 ${GRADIENT_BG} text-white flex-shrink-0`}>
          <div className="bg-white rounded-full p-2">
            <BotIcon className="w-6 h-6" colorClass="text-orange-600" />
          </div>
          <div>
            <div className="font-bold text-lg">{BOT_NAME}</div>
            <div className="text-sm opacity-90">Online</div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {step !== "menu" && (
              <button onClick={goBack} aria-label="Back" className="p-1 rounded-full text-white hover:bg-white hover:bg-opacity-20 transition">
                <FiChevronLeft size={20} />
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 rounded-full text-white hover:bg-white hover:bg-opacity-20 transition">
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div ref={chatBodyRef} className="flex-grow overflow-y-auto bg-gray-50 p-4 pt-3">
          {history.map((msg, index) => {
            if (msg.type === "bot" && (msg.view === step || index === 0 || history.slice(0, index).some(h => h.view === step))) {
              return <BotReply key={index}>{msg.message}</BotReply>;
            }
            if (msg.type === "user") {
              return <UserMessage key={index}>{msg.message}</UserMessage>;
            }
            return null;
          })}
          {renderCurrentContent()}
        </div>

        <div className="border-t bg-white flex-shrink-0">
          <div className="p-3 text-xs text-gray-500 flex justify-around">
            <button className="flex flex-col items-center hover:text-blue-600 transition" onClick={handleContact}>
              <FiPhone size={16} /> <span>Contact</span>
            </button>
            <button className="flex flex-col items-center hover:text-blue-600 transition" onClick={() => { setStep("orders"); loadOrders(); }}>
              <FiClock size={16} /> <span>Orders</span>
            </button>
            {/* Footer Categories now opens in-chat categories */}
            <button className="flex flex-col items-center hover:text-blue-600 transition" onClick={() => { loadCategories(); }}>
              <FiList size={16} /> <span>Categories</span>
            </button>
            {/* Footer Account opens in-chat account panel */}
            <button className="flex flex-col items-center hover:text-blue-600 transition" onClick={() => { handleAction("Open Account Menu", "account", null); }}>
              <FiUser size={16} /> <span>{auth?.user ? "Account" : "Login"}</span>
            </button>
          </div>

          <div className="flex items-center border-t p-2">
            <input type="text" placeholder="Type a message..." disabled className="flex-grow p-2 text-sm border border-gray-300 rounded-full focus:outline-none bg-gray-100 placeholder-gray-500 cursor-not-allowed" />
            <button disabled className={`ml-2 p-2 rounded-full ${GRADIENT_BG} text-white opacity-50 cursor-not-allowed`} aria-label="Send message">
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
