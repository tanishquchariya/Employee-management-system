import express from "express";
import { markAttendance, getMyAttendance } from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/mark", protect, markAttendance);
router.get("/my", protect, getMyAttendance);

export default router;
