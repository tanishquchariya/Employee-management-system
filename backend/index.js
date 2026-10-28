// Entry point for the E.M.S backend (Express 5 + Mongoose 9, ES modules).
// Run with:  npm run dev   (nodemon index.js)   |   npm start

import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { ensureAdmin } from "./utils/ensureAdmin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The admin panel and employee panel both call http://localhost:5000 directly,
// so 5000 is the default port.
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

/* ------------------------------ Middleware ------------------------------ */

// Allowed browser origins: Vite dev servers for the admin + employee panels.
// Add more (comma separated) with CLIENT_URLS in .env for deployed frontends.
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  ...(process.env.CLIENT_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools without an Origin header (Postman, curl) and listed origins.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Express 5 leaves req.body undefined when a request has no body; default it so
// controllers can always destructure it.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Older employee records may store profileImage as a local path such as
// "uploads/abc.png"; the frontends build http://localhost:5000/<that path>.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------------------- Routes -------------------------------- */

app.get("/", (req, res) => {
  res.json({ success: true, message: "E.M.S API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// URL prefix -> route file inside ./routes (each file must `export default` a
// Express router). These prefixes are exactly what the frontends request.
const routeTable = [
  ["/api/auth", "authRoutes.js"],
  ["/api/employee", "employeeRoutes.js"],
  ["/api/payroll", "payrollRoutes.js"],
  ["/api/announcements", "announcementRoutes.js"],
  ["/api/attendance", "attendanceRoutes.js"],
  ["/api/leave", "leaveRoutes.js"],
  ["/api/admin/attendance", "adminAttendanceRoutes.js"],
  ["/api/admin/dashboard", "dashboardRoutes.js"],
];

const mountRoutes = async () => {
  const missing = [];

  for (const [prefix, file] of routeTable) {
    const fileUrl = new URL(`./routes/${file}`, import.meta.url);

    if (!fs.existsSync(fileURLToPath(fileUrl))) {
      missing.push(`  ${prefix.padEnd(24)} -> routes/${file}`);
      continue;
    }

    // A route file that exists but is broken should fail loudly, not be skipped.
    const routeModule = await import(fileUrl.href);
    if (!routeModule.default) {
      throw new Error(`routes/${file} must export a router as its default export`);
    }
    app.use(prefix, routeModule.default);
    console.log(`Mounted ${prefix.padEnd(24)} <- routes/${file}`);
  }

  if (missing.length) {
    console.warn(
      `\n[warn] These route files were not found, so these endpoints will return 404:\n${missing.join("\n")}\n`,
    );
  }
};

/* ---------------------------- Error handling ---------------------------- */

const registerErrorHandlers = () => {
  // Unknown endpoint
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Any error passed to next(err), including multer upload errors
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    if (err.name === "MulterError") {
      return res.status(400).json({ success: false, message: err.message });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  });
};

/* -------------------------------- Startup ------------------------------- */

const start = async () => {
  if (!MONGO_URI) {
    console.error(
      "MONGO_URI is not set. Create backend/.env (see .env.example) and add your MongoDB connection string.",
    );
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error(
      "JWT_SECRET is not set. Add a long random string to backend/.env (see .env.example); login cannot work without it.",
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected");
    await ensureAdmin();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }

  await mountRoutes();
  registerErrorHandlers();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
