import express from "express";
import { getChartData } from "../controllers/dashboardController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/charts", protect, adminOnly, getChartData);

export default router;
