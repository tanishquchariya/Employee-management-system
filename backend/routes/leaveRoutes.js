import express from "express";
import { applyLeave, getMyLeaves } from "../controllers/leaveController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/apply", protect, applyLeave);
router.get("/my", protect, getMyLeaves);

export default router;
