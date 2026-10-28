import express from "express";
import { createPayroll, getPayrolls } from "../controllers/payrollController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin sees every payslip; employees only get their own (filtered in the controller).
router.get("/", protect, getPayrolls);
router.post("/", protect, adminOnly, createPayroll);

export default router;
