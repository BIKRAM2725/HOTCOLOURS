import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CategoryProducts = () => {
  const { catId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/post/${encodeURIComponent(catId)}`);
        if (!mounted) return;
        if (res.data?.success) {
          setProducts(Array.isArray(res.data.products) ? res.data.products : []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [catId]);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        <Spinner />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10 text-red-500 px-4">
        No products found in this category.
        <div className="mt-4">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            ← Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 mt-8">
      {/* Category Name */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Products in {products[0]?.category?.name || "Category"}
      </h1>

      {/* PRODUCTS GRID:
          Mobile: 2 columns (grid-cols-2)
          Laptop/Desktop (lg): 4 columns (lg:grid-cols-4)
      */}
      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-2
          md:grid-cols-2
          lg:grid-cols-4
          gap-6 sm:gap-8
        "
      >
        {products.map((product) => (
          <article
            key={product._id}
            onClick={() => navigate(`/product/${product.slug}`)}
            className="
              bg-white border rounded-xl shadow-sm
              hover:shadow-xl hover:-translate-y-1
              transition-all duration-300
              cursor-pointer flex flex-col
            "
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(`/product/${product.slug}`);
            }}
          >
            {/* Image */}
            <img
              src={
                product.images?.[0] ||
                product.category?.image ||
                "/placeholder.jpg"
              }
              alt={product.title || "Product"}
              loading="lazy"
              className="h-48 sm:h-56 w-full object-cover rounded-t-xl"
            />

            {/* Details */}
            <div className="p-4 flex flex-col flex-1 justify-between">
              <div>
                <h2 className="font-semibold text-lg mb-1 line-clamp-2">
                  {product.title}
                </h2>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {product.hotelLocation || product.description || "No description available"}
                </p>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-gray-800 font-medium">₹{product.price}</span>
                <span
                  className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                    product.isAvailable ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {product.isAvailable ? "Available" : "Not Available"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Back Button */}
      <div className="mt-10 text-center">
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ← Back to Categories
        </Link>
      </div>
    </div>
  );
};

export default CategoryProducts;
