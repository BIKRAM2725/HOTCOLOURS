import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, Link, useNavigate } from "react-router-dom";

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = new URLSearchParams(location.search).get("query");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      try {
        const res = await axios.get(
          `http://localhost:5000/api/post/search?query=${query}`
        );
        if (res.data.success) {
          setPosts(res.data.posts);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Searching...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No results found for “{query}”.
        <div className="mt-4">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 mt-10">
      <h1 className="text-2xl font-bold mb-6">Search Results for “{query}”</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {posts.map((post) => (
          <div
            key={post._id}
            className="border rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col cursor-pointer"
            onClick={() => navigate(`/product/${post.slug}`)}
          >
            <img
              src={
                post.images?.[0] ||
                post.category?.image ||
                "https://via.placeholder.com/300x200?text=No+Image"
              }
              alt={post.title}
              className="h-48 w-full object-cover"
            />
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h2 className="font-semibold text-lg mb-1">{post.title}</h2>
              <p className="text-gray-500 text-sm mb-2">
                {post.hotelLocation?.slice(0, 80)}...
              </p>
              <div className="mt-2 flex justify-between items-center text-gray-700 text-sm font-medium">
                <span>₹{post.price}</span>
                <span>{post.isAvailable ? "Available" : "Unavailable"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default SearchResults;
