
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/UserContext";
import Spinner from "../Spinner";

export default function AdminRoute() {
  const [ok, setOk] = useState(false);
  const [auth] = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const checkUser = async () => {
      try {
        const authData = auth || JSON.parse(localStorage.getItem("auth"));
        const token = authData?.token;

        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axios.get(`${API_BASE}/api/auth/admin-auth`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.ok) {
          setOk(true);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Admin check failed", err);
        navigate("/login");
      } finally {
        setChecking(false);
      }
    };

    checkUser();
  }, [auth, navigate, API_BASE]);

  if (checking) return <Spinner message="Checking admin access..." />;

  return ok ? <Outlet /> : null;
}
