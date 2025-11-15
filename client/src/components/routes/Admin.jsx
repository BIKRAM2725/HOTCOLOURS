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
    const checkUser = async () => {
      try {
        const authData = auth || JSON.parse(localStorage.getItem("auth"));
        const token = authData?.token;
        const user = authData?.user;

        if (!token || !user) {
          navigate("/login");
          return;
        }

        // verify token with backend
        const res = await axios.get("http://localhost:5000/api/auth/admin-auth", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.ok) {
          setOk(true);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("User check failed", err);
        navigate("/login");
      } finally {
        setChecking(false);
      }
    };

    checkUser();
  }, [auth, navigate]);

  if (checking) return <Spinner message="Checking user access..." />;

  return ok ? <Outlet /> : null;
}
