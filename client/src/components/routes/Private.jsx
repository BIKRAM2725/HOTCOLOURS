
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Outlet, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/UserContext";
// import Spinner from "../Spinner";

// export default function PrivateRoutes() {
//   const [ok, setOk] = useState(false);
//   const [auth] = useAuth();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true); // wait until auth loaded

//   useEffect(() => {
//     const authCheck = async () => {
//       try {
//         if (!auth?.token) {
//           navigate("/login");
//           return;
//         }

//         const response = await axios.get(
//           `${import.meta.env.VITE_API_URL}/api/auth/user-auth`,
//           {
//             headers: { Authorization: `Bearer ${auth.token}` },
//           }
//         );

//         if (response.data.ok) setOk(true);
//         else navigate("/login");
//       } catch (error) {
//         console.error("Auth check failed:", error);
//         navigate("/login");
//       } finally {
//         setLoading(false);
//       }
//     };

//     authCheck();
//   }, [auth, navigate]);

//   if (loading) return <Spinner message="Checking authentication..." />;

//   return ok ? <Outlet /> : null;
// }

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
    const authCheck = async () => {
      try {
        // Use context auth, or fallback to localStorage
        const token = auth?.token || JSON.parse(localStorage.getItem("auth"))?.token;

        if (!token) {
          navigate("/login"); // redirect if no token
          return;
        }

        // Replace env variable with direct backend URL
        const response = await axios.get(
          `http://localhost:5000/api/auth/user-auth`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.ok) {
          setOk(true); // token valid → show dashboard
        } else {
          navigate("/login"); // invalid token → redirect
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/login"); // error → redirect
      } finally {
        setChecking(false);
      }
    };

    authCheck();
  }, [auth, navigate]);

  if (checking) return <Spinner />;

  return ok ? <Outlet /> : null;
}
