// CreatePost.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminNavbar from "../admin/AdminNavbar";
import { IoClose } from "react-icons/io5";

export default function CreatePost() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [postData, setPostData] = useState({
    title: "",
    description: "",
    category: "",
    guest: "",
    price: "",
    facilities: "",
    isAvailable: true,
  });

  const [images, setImages] = useState([]); // File objects
  const [imagePreviews, setImagePreviews] = useState([]); // data URLs for preview

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, []);

  useEffect(() => {
    // generate previews whenever images change
    if (!images || images.length === 0) {
      setImagePreviews([]);
      return;
    }
    const readers = images.map((file) => {
      return new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => setImagePreviews(results));
  }, [images]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/category/get-category");
      if (res.data?.success) setCategories(res.data.categories || []);
    } catch (error) {
      console.error("fetchCategories:", error?.response?.data || error.message);
      toast.error("Error fetching categories");
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/post/get-all-posts");
      if (res.data?.success) setPosts(res.data.posts || []);
    } catch (error) {
      console.error("fetchPosts:", error?.response?.data || error.message);
      toast.error("Failed to load posts");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setPostData((p) => ({ ...p, [name]: checked }));
    } else {
      setPostData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    // Optionally limit number of images, size, types here
    setImages((prev) => [...prev, ...files]);
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setPostData({
      title: "",
      description: "",
      category: "",
      guest: "",
      price: "",
      facilities: "",
      isAvailable: true,
    });
    setImages([]);
    setImagePreviews([]);
    setEditingPost(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, category, guest, price, facilities, isAvailable } = postData;

    if (!title || !description || !category || !guest || !price) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      // convert numeric fields to numbers if needed by backend
      formData.append("guest", String(guest));
      formData.append("price", String(price));
      formData.append("isAvailable", isAvailable ? "true" : "false");

      // facilities -> send as array (backend expects JSON array)
      const facArr =
        typeof facilities === "string" && facilities.trim().length > 0
          ? facilities.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
      formData.append("facilities", JSON.stringify(facArr));

      // images
      images.forEach((file) => formData.append("images", file));

      const url = editingPost
        ? `http://localhost:5000/api/post/update-post/${editingPost._id}`
        : "http://localhost:5000/api/post/create-post";

      const method = editingPost ? "put" : "post";

      const res = await axios[method](url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(editingPost ? "Post updated successfully" : "Post created successfully");
        resetForm();
        fetchPosts();
      } else {
        toast.error(res.data?.message || "Unexpected response from server");
      }
    } catch (error) {
      console.error("handleSubmit error:", error?.response?.data || error.message);
      toast.error(error?.response?.data?.message || "Something went wrong while saving the post");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowForm(true);
    setPostData({
      title: post.title || "",
      description: post.description || "",
      category: post.category?._id || post.category || "",
      guest: post.guest || "",
      price: post.price || "",
      facilities: Array.isArray(post.facilities) ? post.facilities.join(",") : post.facilities || "",
      isAvailable: post.isAvailable ?? true,
    });

    // If the post already has remote images and you want to show them in previews,
    // you can set imagePreviews to the remote URLs. But we won't populate `images` (files).
    if (post.images && post.images.length > 0) {
      setImagePreviews(post.images);
    } else {
      setImagePreviews([]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/post/delete-post/${id}`);
      if (res.data?.success) {
        toast.success("Post deleted successfully");
        fetchPosts();
      } else {
        toast.error(res.data?.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("handleDelete:", error?.response?.data || error.message);
      toast.error("Error deleting post");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar on md+, mobile menu handled below */}
      <aside className="hidden md:block">
        <AdminNavbar />
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        {/* Mobile header */}
        <header className="md:hidden bg-white shadow sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-lg font-semibold">Admin</div>
            <button
              aria-label="Toggle menu"
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              Menu
            </button>
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

        {/* Show Button instead of Form */}
        {!showForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingPost(null);
                setImagePreviews([]);
                setImages([]);
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Create New Product
            </button>
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-3xl mx-auto p-8 mb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-4">
                {editingPost ? "Update Post" : "Create New Product"}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                }}
                aria-label="Close form"
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <IoClose />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Enter product title"
                value={postData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
              />

              <textarea
                name="description"
                placeholder="Product Description"
                value={postData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                rows={4}
              ></textarea>

              <select
                name="category"
                value={postData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="guest"
                  placeholder="Total Quantity"
                  value={postData.guest}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Product Price"
                  value={postData.price}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <input
                type="text"
                name="facilities"
                placeholder="Facilities (comma separated)"
                value={postData.facilities}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              />

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImages}
                  className="w-full border border-gray-300 rounded-lg p-3"
                />
                {/* previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative">
                        <img
                          src={src}
                          alt={`preview-${i}`}
                          className="w-full h-24 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageAt(i)}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          <IoClose />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={postData.isAvailable}
                  onChange={handleChange}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700 font-medium">Available</span>
              </label>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="px-6 py-3 rounded-lg bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (editingPost ? "Updating..." : "Creating...") : editingPost ? "Update Post" : "Create Post"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View All Posts */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-2xl font-bold text-indigo-700 mb-6 text-center">All Products</h3>

          {posts.length === 0 ? (
            <p className="text-center text-gray-500">No product found</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition duration-300 p-4 bg-gray-50"
                >
                  <img
                    src={post.images?.[0] || imagePreviews[0] || "/placeholder.jpg"}
                    alt={post.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-bold text-lg text-gray-800">{post.title}</h4>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{post.description}</p>
                  <p className="text-sm text-indigo-600 font-medium mt-2">₹ {post.price}</p>

                  <div className="flex justify-between mt-3">
                    <button
                      onClick={() => handleEdit(post)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
