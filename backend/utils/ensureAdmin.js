import bcrypt from "bcryptjs";
import User from "../model/User.js";

// Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD (.env) when no
// admin exists yet. Does nothing if an admin already exists.
export const ensureAdmin = async () => {
  if (await User.exists({ role: "admin" })) return { created: false };

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[warn] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env and restart to create one.",
    );
    return { created: false };
  }

  await User.create({
    name: process.env.ADMIN_NAME?.trim() || "Admin",
    email,
    password: await bcrypt.hash(password, 10),
    role: "admin",
    isVerified: true,
  });
  console.log(`Admin account created: ${email}`);
  return { created: true, email };
};
