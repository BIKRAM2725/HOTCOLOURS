// import jwt from "jsonwebtoken";
// import User from "../models/user.js";

// //Protect routes based on token

// export const requiredSignIn = async (req, res) => {
//     try
//     {
//         const decode =  jwt.verify(req.headers.authorization,
//             process.env.JWT_SECRET);
//             req.user = decode;
//             next();
//     }
//     catch (error) {
//         console.log(error);

//     }
// };

// //Admin Moddlewares

// export const isAdmin = async (req, res) => {
//     try{
//         const user = await User.findById(req.user_id);

//         if(user.role !== "admin")
//         {
//             return res.status(401).send("Unauthorized");
//         }
//         else
//         {
//             next();
//         }

//     }
//     catch(error)
//     {
//           console.log(error);
//     }
// }



// import jwt from "jsonwebtoken";
// import User from "../models/user.js";

// export const requiredSignIn = (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
//     if (!token) return res.status(401).send({ ok: false });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     console.error(error);
//     return res.status(401).send({ ok: false });
//   }
// };

// // Admin middleware
// export const isAdmin = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user._id); // use req.user from token

//     if (!user || user.role !== "admin") {
//       return res.status(403).json({ message: "Unauthorized - Admin only" });
//     }

//     next();
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// import jwt from "jsonwebtoken";
// import User from "../models/user.js";

// // Middleware to verify JWT token
// export const requiredSignIn = (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
//     if (!token) return res.status(401).json({ ok: false, message: "No token" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // attach token payload
//     next();
//   } catch (error) {
//     console.error("requiredSignIn error:", error);
//     return res.status(401).json({ ok: false, message: "Invalid token" });
//   }
// };

// // Admin middleware
// export const isAdmin = async (req, res, next) => {
//   try {
//     // Use _id from token payload (req.user.id)
//     const user = await User.findById(req.user.id); 
//     if (!user) return res.status(404).json({ ok: false, message: "User not found" });
//     if (user.role !== "admin") return res.status(403).json({ ok: false, message: "Unauthorized - Admin only" });

//     next();
//   } catch (error) {
//     console.error("isAdmin error:", error);
//     return res.status(500).json({ ok: false, message: "Server error" });
//   }
// };




import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const requiredSignIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// // src/middlewares/Auth.js
// import jwt from "jsonwebtoken";
// import User from "../models/user.js"; // adjust if your user model path differs
// import dotenv from "dotenv";
// dotenv.config();

// export const requiredSignIn = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization || req.headers.Authorization;
//     if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });

//     const parts = authHeader.split(" ");
//     if (parts.length !== 2) return res.status(401).json({ success: false, message: "Invalid token format" });

//     const token = parts[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decoded) return res.status(401).json({ success: false, message: "Invalid token" });

//     // attach token payload to req.user; don't assume database fields exist
//     req.user = decoded;
//     return next();
//   } catch (err) {
//     console.error("requiredSignIn error:", err && err.stack ? err.stack : err);
//     return res.status(401).json({ success: false, message: "Authentication failed" });
//   }
// };

// export const isAdmin = async (req, res, next) => {
//   try {
//     // If token contains role, trust it (faster) — otherwise fallback to DB lookup
//     if (req.user?.role) {
//       if (req.user.role === "admin") return next();
//       return res.status(403).json({ success: false, message: "Admin access required" });
//     }

//     const userId = req.user?.id || req.user?._id;
//     if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

//     // try DB lookup but guard errors
//     const user = await User.findById(userId).select("role").lean().catch((e) => {
//       console.error("isAdmin: user lookup failed", e && e.stack ? e.stack : e);
//       return null;
//     });

//     if (!user) return res.status(404).json({ success: false, message: "User not found" });
//     if (user.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });

//     return next();
//   } catch (err) {
//     console.error("isAdmin error:", err && err.stack ? err.stack : err);
//     return res.status(500).json({ success: false, message: "Server error verifying admin" });
//   }
// };
