import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

/**
 * CheckoutPage with Razorpay integration (test mode).
 *
 * Requirements:
 * - Backend endpoints:
 *    POST /api/payments/razorpay/create-order   -> creates Razorpay order, returns { success, razorpayOrder }
 *    POST /api/payments/razorpay/verify         -> verifies signature, optionally creates store order
 *
 * - Set public key in env: REACT_APP_RAZORPAY_KEY (e.g. rzp_test_v8PdcbBOr9XYV8)
 */

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNo: "",
    flatNo: "",
    localAddress: "",
    landmark: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "COD", // "COD" or "Card"
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  const navigate = useNavigate();
  const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_v8PdcbBOr9XYV8"; // test key (public)
  const API_URL = process.env.REACT_APP_API_URL;

  // Load user + token
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        const uid = parsedAuth?.user?.id || parsedAuth?.user?._id || parsedAuth?.user?.uid;
        const token = parsedAuth?.token || parsedAuth?.accessToken || parsedAuth?.authToken;
        setUserId(uid || null);
        setAuthToken(token || null);
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }
  }, []);

  // Load addresses
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("addresses")) || [];
    setAddresses(saved);
    if (saved.length) {
      setSelectedAddressIndex(0);
      setFormData(saved[0]);
    }
  }, []);

  // Compute totals
  useEffect(() => {
    const total = cart?.items?.reduce((acc, i) => acc + (i.product?.price || 0) * i.quantity, 0) || 0;
    let tempDiscount = promoCode === "WELCOMEHOTCOLOR" ? total * 0.25 : 0;
    const tempDelivery = total - tempDiscount >= 200 ? 0 : 100;
    setDiscount(Math.round(tempDiscount));
    setDeliveryCharge(tempDelivery);
    setFinalAmount(Math.round(total - tempDiscount + tempDelivery));
  }, [cart, promoCode]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePromoCode = () => {
    if (promoCode === "WELCOMEHOTCOLOR") {
      toast.success("Promo applied: 25% off");
    } else {
      toast.error("Invalid promo code.");
      setPromoCode("");
    }
  };

  const handleAddOrEditAddress = (mode) => {
    if (mode === "add") {
      setFormData({
        firstName: "",
        lastName: "",
        mobileNo: "",
        flatNo: "",
        localAddress: "",
        landmark: "",
        district: "",
        city: "",
        state: "",
        pincode: "",
        paymentMethod: formData.paymentMethod || "COD",
      });
    }
    setShowAddressForm(true);
  };

  const handleSaveAddress = () => {
    let updated;
    if (addresses[selectedAddressIndex]) {
      // edit
      updated = [...addresses];
      updated[selectedAddressIndex] = formData;
    } else {
      // add
      updated = [...addresses, formData];
      setSelectedAddressIndex(updated.length - 1);
    }
    setAddresses(updated);
    localStorage.setItem("addresses", JSON.stringify(updated));
    setShowAddressForm(false);
  };

  const handleSelectAddress = (index) => {
    setSelectedAddressIndex(index);
    setFormData(addresses[index]);
  };

  // === Razorpay flow ===
  // 1) Create a razorpay order on server -> POST /api/payments/razorpay/create-order { amount, currency, receipt }
  // 2) Open Razorpay Checkout with returned order_id
  // 3) On success, POST to /api/payments/razorpay/verify with razorpay payment details + order payload
  //    The server should verify signature and then create the store order in DB (recommended).
  const createRazorpayOrderOnServer = async (amountInPaise, metadata = {}) => {
    // server should return { success: true, razorpayOrder: { id, amount, currency, ... } }
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const payload = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      metadata,
    };
    const res = await axios.post(`${API_URL}/api/payments/razorpay/create-order`, payload, { headers });
    return res.data;
  };

  const verifyRazorpayPaymentOnServer = async (verificationPayload) => {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const res = await axios.post(`${API_URL}/api/payments/razorpay/verify`, verificationPayload, { headers });
    return res.data;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!cart?.items?.length) {
      toast.info("Your cart is empty!");
      setLoading(false);
      navigate("/");
      return;
    }

    if (!addresses[selectedAddressIndex]) {
      toast.error("Please select or add a delivery address.");
      setLoading(false);
      return;
    }

    // Build minimal payload for server order creation / metadata
    const orderMeta = {
      userId: userId || undefined,
      items: cart.items.map((item) => ({
        productId: item.product._id || item.product.id,
        quantity: item.quantity,
      })),
      address: addresses[selectedAddressIndex],
      paymentMethod: formData.paymentMethod || "COD",
      promoCode: promoCode || null,
      discount,
      deliveryCharge,
      total: finalAmount,
    };

    try {
      if (formData.paymentMethod === "Card") {
        // Razorpay flow
        // amount in paise
        const amountPaise = finalAmount * 100;

        // ensure checkout script loaded
        const ok = await loadRazorpayScript();
        if (!ok) {
          toast.error("Failed to load Razorpay SDK. Try again.");
          setLoading(false);
          return;
        }

        // create razorpay order on server
        const createResp = await createRazorpayOrderOnServer(amountPaise, { meta: orderMeta });
        if (!createResp?.success || !createResp.razorpayOrder) {
          toast.error(createResp?.message || "Failed to create payment order. Try again.");
          setLoading(false);
          return;
        }

        const rOrder = createResp.razorpayOrder;
        // open Razorpay checkout
        const options = {
          key: RAZORPAY_KEY, // public key
          amount: rOrder.amount, // in paise
          currency: rOrder.currency || "INR",
          name: process.env.REACT_APP_APP_NAME || "Hotcolours",
          description: "Order Payment",
          image: process.env.REACT_APP_APP_LOGO || "", // optional
          order_id: rOrder.id,
          prefill: {
            name: `${orderMeta.address.firstName} ${orderMeta.address.lastName}`,
            email:
              JSON.parse(localStorage.getItem("auth") || "{}").user?.email ||
              orderMeta.address?.email ||
              "",
            contact: orderMeta.address.mobileNo,
          },
          handler: async function (resp) {
            // resp contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
            try {
              const verifyPayload = {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                // include orderMeta so server can create the store order after verifying signature
                orderMeta,
              };

              const verifyResp = await verifyRazorpayPaymentOnServer(verifyPayload);

              if (verifyResp?.success) {
                toast.success("Payment successful and order placed");
                clearCart();
                // if server returned created store order, you can navigate to that page
                if (verifyResp.order) {
                  navigate("/user/orders");
                } else {
                  navigate("/user/orders");
                }
              } else {
                toast.error(verifyResp?.message || "Payment verification failed. Contact support.");
              }
            } catch (err) {
              console.error("verify handler error:", err?.response?.data || err.message);
              toast.error("Payment verification failed. Contact support.");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              // user closed the checkout without paying
              toast.info("Payment cancelled");
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // COD flow — create order in your system (same as earlier)
        const payload = {
          ...orderMeta,
        };
        const headers = {
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
          "Content-Type": "application/json",
        };

        const res = await axios.post(`${API_URL}/api/orders/create`, payload, { headers });
        if (res?.data?.success) {
          toast.success("Order created successfully (COD)");
          clearCart();
          navigate("/user/orders");
        } else {
          toast.error(res?.data?.message || "Failed to create order");
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Place order error:", err.response?.data || err.message);
      toast.error("Failed to place order. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Checkout</h2>

      {/* Delivery Type */}
      <div className="mb-6">
        <label className="font-semibold text-gray-800 mb-2 block">Payment Method</label>
        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="COD">Cash on Delivery</option>
          <option value="Card">Card / Razorpay</option>
        </select>
      </div>

      {/* (addresses, address form, promo, summary) — keep unchanged from your original code */}
      {/* Address Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 text-lg">Delivery Address</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAddOrEditAddress("add")}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700"
            >
              Add
            </button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => handleAddOrEditAddress("edit")}
                className="bg-yellow-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-yellow-600"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {addresses.length > 0 ? (
          <div className="space-y-2">
            {addresses.map((addr, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-3 border p-3 rounded-lg cursor-pointer ${
                  idx === selectedAddressIndex ? "border-blue-600 bg-blue-50" : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="selectedAddress"
                  checked={idx === selectedAddressIndex}
                  onChange={() => handleSelectAddress(idx)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {addr.flatNo}, {addr.localAddress}, {addr.city}, {addr.state} - {addr.pincode}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No address saved yet. Add one to continue.</p>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add / Edit Address</h3>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {[
                "firstName",
                "lastName",
                "mobileNo",
                "flatNo",
                "localAddress",
                "landmark",
                "district",
                "city",
                "state",
                "pincode",
              ].map((field) => (
                <input
                  key={field}
                  name={field}
                  placeholder={field.replace(/([A-Z])/g, " $1")}
                  value={formData[field]}
                  onChange={handleChange}
                  required={[
                    "firstName",
                    "lastName",
                    "mobileNo",
                    "flatNo",
                    "localAddress",
                    "district",
                    "city",
                    "state",
                    "pincode",
                  ].includes(field)}
                  className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddressForm(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Code */}
      <div className="mb-6">
        <label className="font-semibold text-gray-800 mb-2 block">Promo Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handlePromoCode}
            type="button"
            className="bg-green-600 text-white px-5 rounded-lg font-medium hover:bg-green-700 transition-all"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="border rounded-xl p-5 bg-gray-50 shadow-inner">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Order Summary</h3>
        {cart?.items?.map((item) => (
          <div key={item.product._id} className="flex justify-between text-gray-700 mb-1">
            <span>
              {item.product.title} × {item.quantity}
            </span>
            <span>₹ {item.product.price * item.quantity}</span>
          </div>
        ))}
        <hr className="my-3" />
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>
            ₹{" "}
            {cart?.items?.reduce(
              (acc, i) => acc + (i.product.price || 0) * i.quantity,
              0
            )}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>- ₹ {discount}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-700">
          <span>Delivery</span>
          <span>₹ {deliveryCharge}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2 text-gray-900">
          <span>Total</span>
          <span>₹ {finalAmount}</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="mt-6 bg-blue-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
      >
        {loading
          ? "Processing..."
          : formData.paymentMethod === "Card"
          ? `Pay ₹ ${finalAmount} with Card`
          : "Place Order (COD)"}
      </button>

      {message && (
        <p
          className={`mt-4 text-center font-semibold ${
            message.includes("Failed") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default CheckoutPage;
