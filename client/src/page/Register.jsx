import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ new
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

  
    if (!name || !email || !password) {
      // setError("All fields are required");
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6 || password.length > 12) {
      // setError("Password must be 6–12 characters long");
      toast.error("Password must be 6–12 characters long");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      // setError("Enter a valid email address");
      toast.error("Enter a valid email address")
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      toast.success(res.data.message || "Registered Successfully");
      navigate("/login");

    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Network error, please try again";
      // setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center p-[100px] bg-gray-100">
        <div className="h-auto w-[380px] rounded-lg shadow-lg">
          {/* Header */}
          <div className="w-full h-[50px] border border-blue-500 font-semibold text-white bg-blue-500 flex items-center justify-center rounded-t-xl text-2xl pt-[8px]">
            Register
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-center pt-5">
              <div className="mb-4 w-[300px]">
                {/* Name */}
                <h2 className="font-semibold text-slate-700 pb-2">Name</h2>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-200 w-full h-[35px] border border-slate-300 
                             hover:border-slate-400 rounded-md shadow-md px-2"
                />

                {/* Email */}
                <h2 className="font-semibold text-slate-700 pb-2 pt-2">Email</h2>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-200 w-full h-[35px] border border-slate-300 
                             hover:border-slate-400 rounded-md shadow-md px-2"
                />

                {/* Password */}
                <h2 className="font-semibold text-slate-700 pb-2 pt-2">Password</h2>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-200 w-full h-[35px] border border-slate-300 
                             hover:border-slate-400 rounded-md shadow-md px-2"
                />

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
            </div>

            {/* Button */}
            <div className="flex items-center justify-center pt-5 pb-5">
              <button
                type="submit"
                disabled={loading} // ✅ disable while loading
                className={`border border-blue-500 w-[250px] h-[35px] rounded-xl 
                           transition-all duration-300 transform shadow-md 
                           ${
                             loading
                               ? "bg-gray-400 cursor-not-allowed"
                               : "bg-blue-500 hover:bg-blue-600 hover:scale-90 shadow-blue-500"
                           }`}
              >
                <h2 className="text-white font-semibold text-[15px]">
                  {loading ? "Registering..." : "Register"}
                </h2>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center pb-8">
              <h2 className="text-slate-700 text-[13px]">
                Already a user?{" "}
                <a
                  className="font-semibold text-slate-700 hover:text-indigo-600"
                  href="/login"
                >
                  Login
                </a>
              </h2>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default Register;
