import jwt from "jsonwebtoken";
import User from "../model/User.js";

// Requires "Authorization: Bearer <token>". On success sets req.user to the User
// document (without password), so controllers can use req.user.id / .role / .email.
// 401 makes both frontends sign the user out; use 403 for "logged in but not allowed".
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    return res.status(401).json({ success: false, message: "Account no longer exists." });
  }

  req.user = user;
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};
