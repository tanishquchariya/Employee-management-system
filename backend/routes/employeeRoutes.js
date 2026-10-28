import express from "express";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getEmployees);
router.post("/", upload.single("profileImage"), createEmployee);
router.put("/:id", upload.single("profileImage"), updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
