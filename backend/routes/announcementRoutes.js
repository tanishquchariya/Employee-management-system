import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAnnouncements);
router.post("/", protect, adminOnly, createAnnouncement);
router.delete("/:id", protect, adminOnly, deleteAnnouncement);

export default router;
