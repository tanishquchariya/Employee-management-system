import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/User.js";
import Employee from "../model/Employee.js";
import { formatDateToString } from "../utils/dateUtils.js";

// Shape returned to both frontends. Employees also get employeeId + joiningDate.
const buildUserPayload = async (user) => {
  const payload = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };

  if (user.role === "user") {
    const employee = await Employee.findOne({ workEmail: user.email });
    if (employee) {
      payload.employeeId = employee.employeeId;
      payload.joiningDate = formatDateToString(employee.joiningDate);
    }
  }
  return payload;
};

// POST /api/auth/login  { email, password }
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Server is missing JWT_SECRET." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    const passwordOk = user ? await bcrypt.compare(String(password), user.password) : false;
    if (!user || !passwordOk) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "This account is not verified." });
    }

    if (user.role === "user") {
      const employee = await Employee.findOne({ workEmail: user.email });
      if (!employee) {
        return res.status(403).json({ success: false, message: "No employee record found for this account." });
      }
      if (employee.accountStatus === "Inactive") {
        return res.status(403).json({ success: false, message: "Your account is inactive. Please contact the admin." });
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ success: true, token, user: await buildUserPayload(user) });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({ success: true, user: await buildUserPayload(req.user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
