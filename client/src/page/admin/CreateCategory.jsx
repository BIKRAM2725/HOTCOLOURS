// CreateCategory.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminNavbar from "../admin/AdminNavbar";
import { IoClose } from "react-icons/io5";

// CRA env variable (REACT_APP_*). Fallback to localhost.
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function CreateCategory() {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/api/category/get-category`);
      if (res.data?.success) setCategories(res.data.categories || []);
    } catch (error) {
      console.error("fetchCategories:", error?.response?.data || error?.message);
      toast.error("Error fetching categories");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setName("");
    setImage(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !image) {
      toast.error("Please enter name and select an image");
      return;
    }

    let auth = null;
    try {
      auth = JSON.parse(localStorage.getItem("auth"));
    } catch {} // ignore

    if (!auth?.token) {
      toast.error("Login required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("image", image);

      const res = await axios.post(`${API}/api/category/create-category`, formData, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        toast.success("Category created successfully");
        resetForm();
        fetchCategories();
      } else {
        toast.error(res.data?.message || "Failed to create category");
      }
    } catch (error) {
      console.error("createCategory:", error?.response?.data || error?.message);
      toast.error(error?.response?.data?.message || "Error creating category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar on md+ */}
      <aside className="hidden md:block">
        <AdminNavbar />
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        {/* Mobile header */}
        <header className="md:hidden bg-white shadow sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-lg font-semibold">Admin</div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Toggle menu"
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                Menu
              </button>
            </div>
          </div>
        </header>

        {/* Mobile slide-over */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-4 right-4 top-16 p-4">
              <AdminNavbar variant="inline" onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-2xl p-6 md:p-8 max-w-4xl mx-auto border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-indigo-700">Create Category</h2>
            <button
              onClick={resetForm}
              aria-label="Reset form"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              Reset
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Category Name</label>
              <input
                type="text"
                placeholder="Enter category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Category name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Category Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-gray-300 rounded-lg p-3"
                aria-label="Category image"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-3 w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating..." : "Create Category"}
            </button>
          </form>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Available Categories</h3>

            {categories.length === 0 ? (
              <p className="text-gray-500">No categories available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((cat, index) => (
                  <div
                    key={cat._id || index}
                    className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col items-center justify-center font-medium text-indigo-700 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    {cat.image && (
                      <img
                        src={cat.image.startsWith("http") ? cat.image : `${API}/${cat.image}`}
                        alt={cat.name}
                        className="w-20 h-20 object-cover rounded-full mb-2"
                      />
                    )}
                    <span className="text-center">{cat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
