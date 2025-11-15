// src/components/RelatedPosts.jsx
import React, { useEffect, useState, useCallback } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function RelatedPosts({ category, excludeId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? 3 : 4
  );
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    if (!category || !excludeId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/post/related/${category}/${excludeId}`
      );
      const dataPosts = Array.isArray(res.data?.posts)
        ? res.data.posts
        : Array.isArray(res.data)
        ? res.data
        : [];
      setPosts(dataPosts);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error fetching related posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category, excludeId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // update visibleCount on resize: mobile -> 3, md+ -> 4
  useEffect(() => {
    function onResize() {
      const isMobile = window.innerWidth < 768; // md breakpoint
      setVisibleCount(isMobile ? 3 : 4);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // keep currentIndex valid when posts length or visibleCount changes
  useEffect(() => {
    if (!posts || posts.length === 0) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((ci) => Math.min(ci, Math.max(0, posts.length - 1)));
  }, [posts, visibleCount]);

  const next = () => {
    if (posts.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const previous = () => {
    if (posts.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const getVisiblePosts = () => {
    if (!posts || posts.length === 0) return [];
    const visible = [];
    for (let i = 0; i < Math.min(visibleCount, posts.length); i++) {
      visible.push(posts[(currentIndex + i) % posts.length]);
    }
    return visible;
  };

  const handleClick = (slug) => navigate(`/product/${slug}`);

  // Loading placeholders
  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto overflow-hidden select-none my-12 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-[25px] pl-[18px]">Related Products</div>
          <div className="flex gap-3">
            <button className="bg-slate-300 w-8 h-8 rounded-full" aria-hidden />
            <button className="bg-slate-300 w-8 h-8 rounded-full" aria-hidden />
          </div>
        </div>

        <div className="flex transition-transform duration-500 ease-in-out">
          {Array.from({ length: visibleCount }).map((_, idx) => (
            <div
              key={idx}
              className="w-[33.333%] md:w-[25%] shrink-0 px-2 flex justify-center items-center h-[280px] bg-gray-100 rounded-lg"
            >
              <Spinner />
            </div>
          ))}
        </div>
        <hr className="my-8 border-[1px]" />
      </div>
    );
  }

  if (!posts || posts.length === 0) return null;

  const visiblePosts = getVisiblePosts();

  return (
    <div className="w-full max-w-[1200px] mx-auto overflow-hidden select-none my-12 px-4">
      <div className="flex items-center justify-between mb-4 ">
        <div className="font-bold text-[25px] pl-[18px]">Related Products</div>
        <div className="flex gap-3">
          <button
            onClick={previous}
            aria-label="Previous"
            className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          >
            <FaArrowLeft />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="flex transition-transform duration-500 ease-in-out">
        {visiblePosts.map((post) => (
          <div
            key={post._id || post.id}
            className="w-[33.333%] md:w-[25%] shrink-0 px-2"
            onClick={() => handleClick(post.slug)}
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-[280px] flex flex-col cursor-pointer transform transition duration-300 hover:scale-105">
              <img
                src={post.images?.[0] || "/placeholder.jpg"}
                alt={post.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-3 flex-1 flex flex-col justify-between">
                <h3 className="font-semibold text-gray-800 h-12 overflow-hidden text-ellipsis">
                  {post.title}
                </h3>
                <p className="text-indigo-600 font-medium mt-1">₹ {post.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="my-8 border-[1px]" />
    </div>
  );
}
