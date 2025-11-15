// src/components/Review/ReviewSection.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/UserContext";

// API base from env (safe) or fallback
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Simple star display helper (caps to 0-5)
const Stars = ({ n }) => {
  const num = Math.max(0, Math.min(5, Number(n) || 0));
  const filled = "★".repeat(num);
  const empty = "☆".repeat(5 - num);
  return <span className="text-yellow-600" aria-hidden>{filled}{empty}</span>;
};

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [auth] = useAuth();

  useEffect(() => {
    if (!productId) return;
    fetchReviews();
    // eslint-disable-next-line
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/review/${productId}`);
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!auth?.user) {
      toast.warn("Sign in to post a review.");
      return;
    }
    if (!productId) {
      toast.error("Product missing");
      return;
    }
    setSubmitting(true);

    try {
      const token =
        auth?.token ||
        (localStorage.getItem("auth") &&
          JSON.parse(localStorage.getItem("auth")).token);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Post review (JSON)
      const res = await axios.post(
        `${API}/api/review/${productId}/review`,
        { rating, comment },
        { headers }
      );

      if (res?.data?.success || res?.status === 201 || res?.status === 200) {
        const saved =
          res?.data?.review || {
            rating,
            comment,
            username: auth.user?.name || "You",
            createdAt: new Date().toISOString(),
          };
        setReviews((r) => [saved, ...r]);
        setRating(5);
        setComment("");
        toast.success("Review submitted");
      } else {
        toast.error(res?.data?.message || "Failed to submit");
      }
    } catch (err) {
      console.error("Review submit error:", err.response?.data || err.message);
      toast.error("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  // helper to get safe image url (absolute or prefixed)
  const safeImageUrl = (img) => {
    if (!img) return null;
    if (typeof img !== "string") return null;
    if (/^https?:\/\//i.test(img)) return img;
    // remove any leading slashes to avoid double //
    return `${API.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT: Reviews list (stacked on mobile, side-by-side on lg) */}
      <div
        className="bg-white rounded-lg p-6 border shadow-sm w-full lg:max-w-[800px] overflow-y-auto"
        style={{ maxHeight: "60vh" }}
        aria-live="polite"
      >
        <h3 className="text-xl font-semibold mb-4">
          Customer Reviews <span className="text-sm text-gray-500">({reviews.length})</span>
        </h3>

        {loading ? (
          <div className="text-gray-500">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="text-sm text-gray-500">No reviews yet. Be the first to review!</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r, idx) => {
              const name =
                r.username ||
                (r.user && (typeof r.user === "object" ? r.user.name : r.user)) ||
                "Anonymous";
              const date = new Date(r.createdAt || r.date || Date.now());
              const imgUrl = safeImageUrl(r.image);
              return (
                <div key={r._id || idx} className="flex gap-4 pb-4 border-b">
                  <div
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-lg"
                    aria-hidden
                  >
                    {String(name || "U").charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{name}</div>
                      <time className="text-xs text-gray-500">
                        {date.toLocaleDateString()}
                      </time>
                    </div>

                    <div className="mt-1">
                      <Stars n={r.rating} />
                    </div>

                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                      {r.comment}
                    </p>

                    {imgUrl && (
                      <div className="mt-2 w-44 h-28 overflow-hidden rounded border">
                        <img
                          src={imgUrl}
                          alt="review"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Review form (responsive, sits below on mobile) */}
      <div className="flex-1 bg-white rounded-lg p-6 border shadow-sm">
        <h4 className="text-lg font-semibold mb-3">Write a review</h4>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <select
              className="w-full border p-2 rounded"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Very Good</option>
              <option value={3}>3 - Good</option>
              <option value={2}>2 - Fair</option>
              <option value={1}>1 - Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comment</label>
            <textarea
              className="w-full border rounded p-2"
              rows={6}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={submitting}
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              {submitting ? "Posting..." : "Post review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRating(5);
                setComment("");
              }}
              className="px-3 py-2 bg-gray-200 rounded"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
