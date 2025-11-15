import React, { useEffect, useState } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";

export default function RelatedPosts({ category, excludeId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const visibleCount = 4; // Number of cards visible at once

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/post/related/${category}/${excludeId}`
        );
        if (res.data.success) setPosts(res.data.posts);
        setCurrentIndex(0); // Reset slider
      } catch (err) {
        console.error("Error fetching related Products:", err);
      } finally {
        setLoading(false);
      }
    };
    if (category && excludeId) fetchPosts();
  }, [category, excludeId]);

  const next = () => {
    setCurrentIndex((prev) =>
      posts.length > 0 ? (prev + 1) % posts.length : prev
    );
  };

  const previous = () => {
    setCurrentIndex((prev) =>
      posts.length > 0 ? (prev - 1 + posts.length) % posts.length : prev
    );
  };

  const getVisiblePosts = () => {
    let visible = [];
    for (let i = 0; i < visibleCount; i++) {
      if (posts.length > 0) {
        visible.push(posts[(currentIndex + i) % posts.length]);
      }
    }
    return visible;
  };

  const handleClick = (slug) => navigate(`/product/${slug}`);

  if (loading) {
    // Show spinner placeholders instead of hiding the section
    return (
      <div className="w-full max-w-[1200px] mx-auto flex gap-4 justify-center flex-wrap my-12">
        {Array.from({ length: visibleCount }).map((_, index) => (
          <div
            key={index}
            className="w-[23%] h-[280px] bg-gray-100 rounded-lg flex items-center justify-center"
          >
            <Spinner />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="w-full max-w-[1200px] mx-auto overflow-hidden select-none my-12">
      <div className="flex items-center justify-between mb-4 font-bold text-xl text-gray-900">
        Related Products
        <div className="flex gap-3">
          <button
            onClick={previous}
            className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded-full flex items-center justify-center"
          >
            <FaArrowLeft />
          </button>
          <button
            onClick={next}
            className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded-full flex items-center justify-center"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="flex transition-transform duration-500 ease-in-out">
        {getVisiblePosts().map((post) => (
          <div
            key={post._id}
            onClick={() => handleClick(post.slug)}
            className="w-[25%] shrink-0 px-2"
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
