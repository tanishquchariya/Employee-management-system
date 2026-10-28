import express from "express";
import {
  getAttendanceList,
  getEmployeeAttendanceDetails,
  getLeaveRequests,
  updateLeaveStatus,
} from "../controllers/adminAttendanceController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/list", getAttendanceList);
router.get("/employee/:id", getEmployeeAttendanceDetails);
router.get("/leave", getLeaveRequests);
router.put("/leave/:id", updateLeaveStatus);

export default router;
