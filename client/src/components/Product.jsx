import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";


const Product = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/category/get-category"
        );
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
  }, []);

  return (
    <>
      <div className="flex flex-col mt-12 max-w-[1200px] mx-auto">
        <h1 className="font-bold text-[30px] text-slate-800">
          CATEGORIES
        </h1>
        <p className="text-gray-600 mb-10 max-w-xl">
          Pure Taste. Pure Tradition.
        </p>
      </div>

      {/* Category Grid */}
      <div className="flex gap-4 justify-center flex-wrap">
        {loading
          ? // Show 4 placeholder boxes with spinners while loading
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="relative rounded-xl overflow-hidden shadow-md bg-gray-100 h-48 w-[18rem] flex justify-center items-center"
              >
                <Spinner />
              </div>
            ))
          : categories.length === 0
          ? // No category found
            (
              <div className="flex justify-center items-center py-10 text-gray-500 w-full">
                No categories found
              </div>
            )
          : // Categories loaded
            categories.map((cat) => (
                            <Link key={cat._id} to={`/category/${cat._id}`}>
                <div className="relative rounded-xl overflow-hidden hover:shadow-lg hover:scale-95 transition duration-300 cursor-pointer flex flex-col justify-center items-center bg-white">
                  <img
                    className="rounded-lg object-cover h-48 w-[18rem] transition-transform duration-300 hover:scale-105"
                    src={cat.image}
                    alt={cat.name}
                  />
                  <h2 className="text-lg font-semibold mt-2 mb-2 text-gray-800">
                    {cat.name}
                  </h2>
                </div>
              </Link>
            ))}
      </div>
    </>
  );
};

export default Product;
