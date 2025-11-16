// src/page/ProductDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner";
import Product from "../components/Product/Product";
import RelatedPosts from "../components/Product/RelatedPost";
import ReviewSection from "../components/Product/ReviewSection";

// Use env, fallback to localhost for dev
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const urls = [
          `${API_BASE}/api/product/get-product/${slug}`,
          `${API_BASE}/api/post/get-post/${slug}`,
        ];

        let res = null;
        for (const u of urls) {
          try {
            res = await axios.get(u);
            if (res?.data?.success) break;
          } catch (err) {
            res = null;
          }
        }

        if (res?.data?.success) {
          const p = res.data.product ?? res.data.post;
          setProduct(p);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) return <Spinner />;

  if (!product)
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)] text-gray-600 text-xl">
        Product not found.
      </div>
    );

  return (
    <>
      {/* Product main section */}
      <div className="max-w-6xl mx-auto">
        <Product product={product} />
      </div>

      {/* Reviews */}
      <div className="w-full bg-gray-50 py-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <ReviewSection productId={product._id || product.id} />
        </div>
      </div>

      {/* Related posts */}
      <div className="max-w-6xl mx-auto mt-16 px-4">
        <RelatedPosts category={product.category} excludeId={product._id} />
      </div>
    </>
  );
}
