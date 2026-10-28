// Usage: npm run seed   (reads ADMIN_EMAIL / ADMIN_PASSWORD from .env)
import "dotenv/config";
import mongoose from "mongoose";
import { ensureAdmin } from "../utils/ensureAdmin.js";

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set in .env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
const result = await ensureAdmin();
if (!result.created) console.log("Nothing to do (an admin already exists, or ADMIN_* is not set).");
await mongoose.disconnect();
