// src/page/CreatedPosts.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function CreatedPosts({ category, excludeId }) {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const navigate = useNavigate();

  // adapt visibleCount to viewport
  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth;
      if (w >= 1200) setVisibleCount(4);
      else if (w >= 900) setVisibleCount(3);
      else if (w >= 640) setVisibleCount(2);
      else setVisibleCount(1);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  // fetch related posts
  useEffect(() => {
    let mounted = true;
    const fetchPosts = async () => {
      if (!category || !excludeId) return;
      setLoading(true);
      try {
        const res = await axios.get(
          `${API}/api/post/related/${encodeURIComponent(category)}/${encodeURIComponent(excludeId)}`
        );
        if (mounted && res.data?.success) {
          setPosts(Array.isArray(res.data.posts) ? res.data.posts : []);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Error fetching related posts:", err);
        if (mounted) setPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPosts();
    return () => {
      mounted = false;
    };
  }, [category, excludeId]);

  // navigation
  const next = useCallback(() => {
    if (!posts.length) return;
    // if items <= visibleCount, do nothing
    if (posts.length <= visibleCount) return;
    setCurrentIndex((prev) => {
      // max start index where a full page fits = posts.length - visibleCount
      const maxStart = posts.length - visibleCount;
      return prev >= maxStart ? 0 : prev + 1;
    });
  }, [posts, visibleCount]);

  const previous = useCallback(() => {
    if (!posts.length) return;
    if (posts.length <= visibleCount) return;
    setCurrentIndex((prev) => {
      const maxStart = posts.length - visibleCount;
      return prev <= 0 ? maxStart : prev - 1;
    });
  }, [posts, visibleCount]);

  // Visible slice for rendering (we render all but slide container transforms)
  const totalWidthPercent = posts.length ? (posts.length / visibleCount) * 100 : 100;
  const translatePercent = posts.length
    ? -(currentIndex * (100 / visibleCount))
    : 0;

  // clickable navigate
  const handleClick = (slug) => {
    if (!slug) return;
    const formattedSlug = String(slug).toLowerCase().replace(/\s+/g, "-");
    navigate(`/product/${formattedSlug}`);
  };

  // touch handlers for swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const endX = e.changedTouches?.[0]?.clientX ?? null;
    if (endX == null) return;
    const dx = endX - touchStartX.current;
    const threshold = 50; // px
    if (dx > threshold) previous();
    else if (dx < -threshold) next();
    touchStartX.current = null;
  };

  if (loading) return null;
  if (!posts || posts.length === 0) return null;

  return (
    <section className="w-full max-w-[1200px] mx-auto overflow-hidden select-none my-12">
      <div className="flex items-center justify-between mb-4 font-bold text-xl text-gray-900 px-2">
        <h3>Related Hotels</h3>
        <div className="flex gap-3">
          <button
            onClick={previous}
            className="bg-slate-300 hover:bg-slate-400 w-9 h-9 rounded-full flex items-center justify-center"
            aria-label="Previous related"
            title="Previous"
          >
            <FaArrowLeft />
          </button>
          <button
            onClick={next}
            className="bg-slate-300 hover:bg-slate-400 w-9 h-9 rounded-full flex items-center justify-center"
            aria-label="Next related"
            title="Next"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* slider viewport */}
      <div
        ref={containerRef}
        className="relative w-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            width: `${totalWidthPercent}%`,
            transform: `translateX(${translatePercent}%)`,
          }}
        >
          {posts.map((post, idx) => {
            // compute width for each item as fraction of viewport
            const itemWidthPercent = 100 / visibleCount / (posts.length / posts.length); // simplifies to 100/visibleCount
            const image = post.images?.[0] || "/placeholder.jpg";
            const key = post._id ?? `p-${idx}`;
            return (
              <div
                key={key}
                className="px-2 shrink-0"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div
                  onClick={() => handleClick(post.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleClick(post.slug);
                  }}
                  className="bg-white rounded-lg shadow-md overflow-hidden h-[280px] flex flex-col cursor-pointer transform transition duration-300 hover:scale-105"
                >
                  <img
                    src={image}
                    alt={post.title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="font-semibold text-gray-800 line-clamp-2">
                      {post.title}
                    </h4>
                    <p className="text-indigo-600 font-medium mt-1">₹ {post.price}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* simple pager dots */}
      {posts.length > visibleCount && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: posts.length - visibleCount + 1 }).map((_, i) => (
            <button
              key={`dot-${i}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-gray-800" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
