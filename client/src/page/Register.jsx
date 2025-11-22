// // src/page/Register.jsx
// import React, { useState } from "react";
// import { ToastContainer, toast } from "react-toastify";
// import { useNavigate, Link } from "react-router-dom";
// import axios from "axios";

// const API_BASE = process.env.REACT_APP_API_URL;

// function Register() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const validateEmail = (email) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!name.trim() || !email.trim() || !password) {
//       toast.error("All fields are required");
//       return;
//     }

//     if (!validateEmail(email.trim())) {
//       toast.error("Enter a valid email address");
//       return;
//     }

//     if (password.length < 6 || password.length > 12) {
//       toast.error("Password must be 6–12 characters long");
//       return;
//     }

//     try {
//       setLoading(true);
//       const res = await axios.post(`${API_BASE}/api/auth/register`, {
//         name: name.trim(),
//         email: email.trim(),
//         password,
//       });

//       toast.success(res.data.message || "Registered successfully");
//       setTimeout(() => {
//         navigate("/login");
//       }, 800);
//     } catch (err) {
//       const errorMsg =
//         err?.response?.data?.message || "Network error, please try again";
//       toast.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
//       <div className="w-full max-w-md">
//         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//           {/* Header */}
//           <div className="bg-blue-600 text-white py-4 px-6">
//             <h2 className="text-2xl font-semibold text-center">Register</h2>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} className="p-6 space-y-4">
//             <div>
//               <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//                 Name
//               </label>
//               <input
//                 id="name"
//                 name="name"
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="mt-2 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 placeholder="Your full name"
//                 autoComplete="name"
//               />
//             </div>

//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                 Email
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="mt-2 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 placeholder="you@example.com"
//                 autoComplete="email"
//               />
//             </div>

//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                 Password
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="mt-2 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 placeholder="6-12 characters"
//                 autoComplete="new-password"
//               />
//             </div>

//             {error && <p className="text-red-500 text-sm">{error}</p>}

//             <div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white font-semibold transition ${
//                   loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
//                 }`}
//               >
//                 {loading ? (
//                   <>
//                     <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                         fill="none"
//                       />
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                       />
//                     </svg>
//                     Registering...
//                   </>
//                 ) : (
//                   "Register"
//                 )}
//               </button>
//             </div>

//             <div className="text-center text-sm text-gray-600">
//               Already a user?{" "}
//               <Link to="/login" className="font-medium text-blue-600 hover:underline">
//                 Login
//               </Link>
//             </div>
//           </form>
//         </div>

//         <ToastContainer position="top-right" />
//       </div>
//     </div>
//   );
// }

// export default Register;


import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const auth = localStorage.getItem("auth");

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  const parsed = JSON.parse(auth);

  if (!parsed?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
