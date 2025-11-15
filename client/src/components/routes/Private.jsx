// src/components/routes/Private.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/UserContext";
import Spinner from "../Spinner";

export default function PrivateRoutes() {
  const [ok, setOk] = useState(false);
  const [auth] = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        // prefer context auth; fallback to localStorage
        const stored = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("auth")) : null;
        const authData = auth || stored || {};
        const token = authData?.token;
        const user = authData?.user;

        if (!token) {
          // no token -> login
          if (mounted) navigate("/login");
          return;
        }

        // verify token with backend (user-auth endpoint)
        const res = await axios.get("http://localhost:5000/api/auth/user-auth", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // backend returned ok -> token valid
        if (res?.data?.ok) {
          // if the user (from context/localStorage) is admin, redirect to admin dashboard
          if (user?.role === "admin") {
            if (mounted) navigate("/admin/details");
            return;
          }
          // non-admin user with valid token -> allow access
          if (mounted) setOk(true);
        } else {
          if (mounted) navigate("/login");
        }
      } catch (err) {
        console.error("User check failed", err);
        if (mounted) navigate("/login");
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, [auth, navigate]);

  if (checking) return <Spinner message="Checking user access..." />;

  return ok ? <Outlet /> : null;
}
