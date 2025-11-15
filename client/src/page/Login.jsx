import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();

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
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const authData = {
        user: response.data?.user,
        token: response.data?.token,
      };

      // Save to state + localStorage
      setAuth(authData);
      localStorage.setItem("auth", JSON.stringify(authData));

      toast.success("Login Successful");

      //  Redirect based on role
      setTimeout(() => {
        if (response.data?.user?.role === "admin") {
          navigate("/admin/details");
        } else {
          navigate("/");
        }
      }, 1000);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login Failed, check email or password"
      );
    }
  };

  return (
    <div className="flex items-center justify-center p-[100px] bg-gray-100">
      <div className="h-auto w-[380px] rounded-lg shadow-lg">
        <div className="w-full h-[50px] border border-blue-500 font-semibold text-white bg-blue-500 flex items-center justify-center rounded-t-xl text-2xl">
          Login In
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-center pt-5">
            <div className="mb-4 w-[300px]">
              <h2 className="font-semibold text-slate-700 pb-2">Email</h2>
              <input
                className="bg-slate-200 w-full h-[35px] border border-slate-300 rounded-md shadow-md p-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <h2 className="font-semibold text-slate-700 pb-2 pt-2">
                Password
              </h2>
              <input
                className="bg-slate-200 w-full h-[35px] border border-slate-300 rounded-md shadow-md p-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="ml-11 w-[290px] flex items-center">
            <input className="accent-blue-500" type="checkbox" />
            <h2 className="text-[15px] pl-1">Keep Sign in</h2>
            <a
              href="#"
              className="text-blue-600 text-[12px] ml-auto cursor-pointer"
            >
              Forget password
            </a>
          </div>

          <div className="flex items-center justify-center pt-5 pb-5">
            <button
              type="submit"
              className="border border-blue-500 bg-blue-500 w-[250px] h-[35px] rounded-xl hover:bg-blue-600 transition-all duration-300 hover:scale-90 shadow-md shadow-blue-500"
            >
              <h2 className="text-white font-semibold text-[15px]">Sign In</h2>
            </button>
          </div>

          <div className="flex items-center justify-center pb-8">
            <h2 className="text-slate-700 text-[13px]">
              New user?{" "}
              <a
                className="font-semibold text-slate-700 hover:text-indigo-600"
                href="/register"
              >
                Register
              </a>
            </h2>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}
          {message && <p className="text-green-500 text-center">{message}</p>}
        </form>

        <ToastContainer position="top-right" />
      </div>
    </div>
  );
}

export default Login;
