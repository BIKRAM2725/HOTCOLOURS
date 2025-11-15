// src/components/Product.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { MdLocalShipping } from "react-icons/md";
import { FaMoneyBillWave } from "react-icons/fa";
import { ImUndo2 } from "react-icons/im";
import { toast } from "react-toastify";
import { useAuth } from "../../context/UserContext";
import axios from "axios";

// Category style helpers (unchanged)
const CATEGORY_STYLE_MAP = {
  Electronics: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  Clothing: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Beauty: "bg-pink-100 text-pink-800 ring-pink-200",
  Spices: "bg-amber-100 text-amber-800 ring-amber-200",
  Home: "bg-yellow-100 text-yellow-800 ring-yellow-200",
};
const fallbackStyles = [
  "bg-slate-100 text-slate-800 ring-slate-200",
  "bg-violet-100 text-violet-800 ring-violet-200",
  "bg-rose-100 text-rose-800 ring-rose-200",
  "bg-cyan-100 text-cyan-800 ring-cyan-200",
  "bg-orange-100 text-orange-800 ring-orange-200",
];
function hashToIndex(str, mod) {
  if (!str) return 0;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % mod;
}
const getCategoryClasses = (category) => {
  if (!category) return "bg-slate-100 text-slate-800 ring-slate-200";
  const name = typeof category === "string" ? category : category?.name || "";
  const mapped =
    CATEGORY_STYLE_MAP[name] ||
    CATEGORY_STYLE_MAP[name?.charAt(0)?.toUpperCase() + name?.slice(1)];
  if (mapped) return mapped;
  const idx = hashToIndex(String(name).toLowerCase(), fallbackStyles.length);
  return fallbackStyles[idx];
};

// Use environment API base (fallback to localhost)
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Product({ product }) {
  const title = product?.name || product?.title || "Untitled Product";
  const price = product?.price ?? 0;
  const stock = product?.totalQuantity ?? product?.guest ?? 0;
  const images =
    product?.images && product.images.length ? product.images : ["/placeholder.jpg"];
  const category = product?.category?.name || product?.category || "Uncategorized";
  const brand = product?.brand || product?.hotelLocation || "Hotcolours";
  const prodId = product?._id || product?.id;

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [auth] = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Reviews state
  const [reviews, setReviews] = useState(product?.reviews || []);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewFile, setReviewFile] = useState(null);
  const [previewReviewUrl, setPreviewReviewUrl] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setReviews(product?.reviews || []);
    setSelectedImage((product?.images && product.images[0]) || "/placeholder.jpg");
  }, [product]);

  const handleAddToCart = async () => {
    if (!auth?.user) {
      toast.warn("Please sign in to add items to your cart.");
      navigate("/login");
      return;
    }
    if (!product?.isAvailable) {
      toast.error("Sorry, product not available.");
      return;
    }
    try {
      await addToCart(product, 1);
      toast.success("Added to cart!");
      navigate("/cart");
    } catch (err) {
      toast.error("Failed to add to cart!");
      console.error(err);
    }
  };

  const handleBuy = async () => {
    if (!auth?.user) {
      toast.warn("Please sign in to buy items.");
      navigate("/login");
      return;
    }
    if (!product?.isAvailable) {
      toast.error("Sorry, product not available.");
      return;
    }
    try {
      await addToCart(product, 1);
      navigate("/cart");
    } catch (err) {
      toast.error("Failed to proceed to buy!");
      console.error(err);
    }
  };

  // review image selection & preview
  const onSelectReviewImage = (e) => {
    const f = e.target.files?.[0] ?? null;
    setReviewFile(f);
    if (f) setPreviewReviewUrl(URL.createObjectURL(f));
    else setPreviewReviewUrl(null);
  };

  // helper: get display name from a review object
  const getReviewerName = (r) => {
    if (!r) return "Anonymous";
    if (r.username) return r.username;
    if (typeof r.user === "object" && r.user?.name) return r.user.name;
    if (typeof r.user === "string" && r.user.length < 30) return r.user;
    return r.user && typeof r.user === "string" ? `User` : "Anonymous";
  };

  // Submit review: posting to backend (uses API env)
  const submitReview = async (e) => {
    e.preventDefault();
    if (!auth?.user) {
      toast.warn("Please sign in to add a review.");
      navigate("/login");
      return;
    }
    if (!prodId) {
      toast.error("Product ID not found.");
      return;
    }
    setSubmittingReview(true);

    try {
      const token =
        auth?.token ||
        (localStorage.getItem("auth") && JSON.parse(localStorage.getItem("auth")).token);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let res = null;
      if (reviewFile) {
        const fd = new FormData();
        fd.append("rating", rating);
        fd.append("comment", reviewText);
        fd.append("image", reviewFile);
        res = await axios.post(
          `${API}/api/review/${prodId}/review`,
          fd,
          {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        res = await axios.post(
          `${API}/api/review/${prodId}/review`,
          { rating, comment: reviewText },
          { headers }
        );
      }

      if (res?.data?.success || res?.status === 201 || res?.status === 200) {
        const saved =
          res?.data?.review ||
          ({
            rating,
            comment: reviewText,
            image: previewReviewUrl || null,
            username: auth.user?.name || auth.user?.username || "You",
            createdAt: new Date().toISOString(),
          });
        setReviews((r) => [saved, ...r]);
        setRating(5);
        setReviewText("");
        setReviewFile(null);
        if (previewReviewUrl) {
          URL.revokeObjectURL(previewReviewUrl);
          setPreviewReviewUrl(null);
        }
        toast.success("Review submitted — thank you!");
      } else {
        toast.error(res?.data?.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("Review submit error:", err.response?.data || err.message);
      toast.error("Error submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const catClasses = getCategoryClasses(category);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto mt-6 p-6 rounded-2xl shadow-lg bg-white">
        {/* Grid: single column on small, two columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: Images */}
          <div className="flex flex-col">
            <div className="w-full h-[320px] md:h-[420px] bg-gray-100 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
              <img
                src={selectedImage}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            {/* Thumbnails: horizontal scroll on mobile */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 focus:outline-none ${
                    selectedImage === img ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="flex flex-col">
            <div className="mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{title}</h1>
                
              </div>
              <p className="text-gray-700 mt-2 text-sm">{product?.shortDescription || product?.description?.slice(0, 250)}.........</p>
            </div>
            
            {/* Expandable long description on mobile */}
            {product?.description && (
              <div className="mt-6 text-gray-700 text-sm">
                <details className="cursor-pointer">
                  <summary className="font-medium mb-2">Product details</summary>
                  <div className="mt-2 prose prose-sm max-w-none">{product.description}</div>
                </details>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:items-end">
              <div>
                <div className="text-sm text-gray-500">Price</div>
                <div className="text-2xl font-extrabold text-red-600">₹ {price}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Stock</div>
                <div className={`text-lg font-medium ${stock > 0 ? "text-gray-800" : "text-red-600"}`}>
                  {stock > 0 ? stock : "Out of stock"}
                </div>
              </div>

              <div className="ml-auto text-sm text-gray-500">
                <div>Brand: <span className="font-medium text-gray-800">{brand}</span></div>
                <div>SKU: <span className="font-medium text-gray-700">{product?.sku || "—"}</span></div>
              </div>
            </div>

            {/* feature cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <MdLocalShipping className="text-green-600" size={20} />
                <div>
                  <div className="text-sm font-medium">Free Delivery</div>
                  <div className="text-xs text-gray-500">On orders over ₹499</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <ImUndo2 className="text-indigo-600" size={18} />
                <div>
                  <div className="text-sm font-medium">3-day Replacement</div>
                  <div className="text-xs text-gray-500">Hassle-free returns</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <FaMoneyBillWave className="text-yellow-600" size={18} />
                <div>
                  <div className="text-sm font-medium">Cash on Delivery</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
              </div>
            </div>

            {/* Actions: stacked on mobile, inline on wider screens */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBuy}
                disabled={!product?.isAvailable}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-lg font-semibold ${
                  product?.isAvailable ? "bg-red-600 text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                Buy Now
              </button>

              <button
                onClick={handleAddToCart}
                className="w-full sm:w-auto px-5 py-3 bg-white border rounded-xl"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Reviews area (below grid) */}
        <div className="mt-8">
          {/* Reviews list */}
          <div className="mt-6 space-y-4">
            {reviews.map((r, idx) => (
              <div key={r._id || idx} className="p-3 border rounded-md bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">
                    {getReviewerName(r)?.[0] || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{getReviewerName(r)}</div>
                      <div className="text-xs text-gray-500">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-yellow-600">{Array(r.rating || 5).fill("★").join("")}</div>
                    <div className="text-sm text-gray-700 mt-1">{r.comment || r.comment}</div>
                    {r.image && <img src={r.image.startsWith("http") ? r.image : `${API}/${r.image}`} alt="review" className="mt-2 w-36 h-24 object-cover rounded-md border" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
