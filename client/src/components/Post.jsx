import React, { useEffect, useState } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import Spinner from "./Spinner";

export default function PostSlider() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = 4; // Number of visible slides at a time
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/post/get-all-posts");
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const next = () => {
    setCurrentIndex((prevIndex) =>
      posts.length > 0 ? (prevIndex + 1) % posts.length : prevIndex
    );
  };

  const previous = () => {
    setCurrentIndex((prevIndex) =>
      posts.length > 0 ? (prevIndex - 1 + posts.length) % posts.length : prevIndex
    );
  };

  const handlePostClick = (slug) => {
    navigate(`/product/${slug}`);
  };

  const getVisiblePosts = () => {
    if (posts.length === 0) return [];
    let visible = [];
    for (let i = 0; i < visibleCount; i++) {
      visible.push(posts[(currentIndex + i) % posts.length]);
    }
    return visible;
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto overflow-hidden select-none my-8">
      <div className="flex items-center justify-between mb-4 font-bold">
        Latest Products
        <div className="flex gap-3">
          <div
            onClick={previous}
            className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          >
            <FaArrowLeft />
          </div>
          <div
            onClick={next}
            className="bg-slate-300 hover:bg-slate-400 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          >
            <FaArrowRight />
          </div>
        </div>
      </div>

      <div className="flex transition-transform duration-500 ease-in-out">
        {loading
          ? Array.from({ length: visibleCount }).map((_, idx) => (
              <div
                key={idx}
                className="w-[25%] shrink-0 px-2 flex justify-center items-center h-[280px] bg-gray-100 rounded-lg"
              >
                <Spinner />
              </div>
            ))
          : getVisiblePosts().map((post) => (
              <div
                key={post._id}
                className="w-[25%] shrink-0 px-2"
                onClick={() => handlePostClick(post.slug)}
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
      <hr className="my-6 border-[1px]" />
    </div>
  );
}
