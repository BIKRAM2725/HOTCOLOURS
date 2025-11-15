import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";

const Product = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/category/get-category`);
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [API_URL]);

  return (
    <>
      <div className="mt-12 max-w-[1200px] mx-auto px-4 sm:px-6">
        <h1 className="font-bold text-3xl text-slate-800">CATEGORIES</h1>
        <p className="text-gray-600 mb-6 max-w-xl">Pure Taste. Pure Tradition.</p>

        {/* GRID RESPONSIVE — Mobile 2, Tablet 3, Laptop 4 */}
        <div
          className="grid gap-6
                     grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
                     items-stretch"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden shadow-sm bg-gray-100 flex flex-col"
                >
                  <div className="h-40 flex items-center justify-center">
                    <Spinner />
                  </div>
                </div>
              ))
            : categories.length === 0
            ? (
                <div className="col-span-full text-center text-gray-500 py-10">
                  No categories found
                </div>
              )
            : categories.map((cat) => (
                <Link key={cat._id} to={`/category/${cat._id}`}>
                  <div className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition transform hover:-translate-y-1 duration-200">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-40 object-cover"
                    />
                    <h2 className="text-center text-lg font-semibold p-3 text-gray-800">
                      {cat.name}
                    </h2>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </>
  );
};

export default Product;
