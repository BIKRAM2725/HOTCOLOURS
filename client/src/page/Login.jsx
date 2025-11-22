// src/page/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/UserContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();

<<<<<<< HEAD
  // ✅ BASE URL FROM .env
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
=======
  //  BASE URL FROM .env
  const API = process.env.REACT_APP_API_URL;
>>>>>>> 297cb2b (Fixed Checkout import, renamed file, updated routes, cleaned env handling)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6 || password.length > 12) {
      toast.error("Password must be 6-12 characters long");
      return;
    }

    try {
      const response = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      const authData = {
        user: response.data?.user,
        token: response.data?.token,
      };

      setAuth(authData);
      localStorage.setItem("auth", JSON.stringify(authData));

      toast.success("Login Successful");

      setTimeout(() => {
        if (response.data?.user?.role === "admin") {
          navigate("/admin/details");
        } else {
          navigate("/");
        }
      }, 700);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Login Failed, check email or password"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full px-4 py-12 sm:py-16 md:py-20">
        <div className="mx-auto">
          <div className="w-full max-w-md md:w-[380px] mx-auto rounded-lg shadow-lg overflow-hidden">

            <div className="w-full h-[50px] border border-blue-500 font-semibold text-white bg-blue-500 flex items-center justify-center rounded-t-xl text-2xl">
              Login In
            </div>

            <div className="text-center text-[14px] text-red-600 font-semibold mt-3">
              Admin: admin2025@gmail.com | Password: 123456
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6">
              <div className="flex items-center justify-center pt-2">
                <div className="mb-4 w-full">
                  <h2 className="font-semibold text-slate-700 pb-2">Email</h2>
                  <input
                    className="bg-slate-200 w-full h-[40px] border border-slate-300 rounded-md shadow-sm px-3"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <h2 className="font-semibold text-slate-700 pb-2 pt-4">
                    Password
                  </h2>
                  <input
                    className="bg-slate-200 w-full h-[40px] border border-slate-300 rounded-md shadow-sm px-3"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2">
                  <input className="accent-blue-500 h-4 w-4" type="checkbox" />
                  <span className="text-[15px]">Keep Sign in</span>
                </label>

                <div className="ml-auto">
                  <Link
                    to="/forgot-password"
                    className="text-blue-600 text-[13px] hover:underline"
                  >
                    Forget password
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center pt-6 pb-4">
                <button
                  type="submit"
                  className="border border-blue-500 bg-blue-500 w-[250px] h-[38px] rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-[0.98] shadow-md shadow-blue-500 text-white font-semibold"
                >
                  Sign In
                </button>
              </div>

              <div className="flex items-center justify-center pb-2">
                <h2 className="text-slate-700 text-[13px]">
                  New user?{" "}
                  <Link
                    className="font-semibold text-slate-700 hover:text-indigo-600"
                    to="/register"
                  >
                    Register
                  </Link>
                </h2>
              </div>

              {error && (
                <p className="text-red-500 text-center mt-2">{error}</p>
              )}
              {message && (
                <p className="text-green-500 text-center mt-2">{message}</p>
              )}
            </form>

            <ToastContainer position="top-right" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
