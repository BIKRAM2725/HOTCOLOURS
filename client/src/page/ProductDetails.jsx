// src/page/ProductDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner";
import Product from "../components/Product/Product";
import RelatedPosts from "../components/Product/RelatedPost";
import ReviewSection from "../components/Product/ReviewSection";

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const urls = [
          `http://localhost:5000/api/product/get-product/${slug}`,
          `http://localhost:5000/api/post/get-post/${slug}`,
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
          // unify shape: product could be in res.data.product or res.data.post
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
      {/* Product (keeps the existing product layout) */}
      <div className="max-w-6xl mx-auto">
        <Product product={product} />
      </div>

      {/* Reviews - full width background, content limited to max 1200px */}
      <div className="w-full bg-gray-50 py-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <ReviewSection productId={product._id || product.id} />
        </div>
      </div>

      {/* Related posts (kept inside 6xl like before) */}
      <div className="max-w-6xl mx-auto mt-16 px-4">
        <RelatedPosts category={product.category} excludeId={product._id} />
      </div>
    </>
  );
}
