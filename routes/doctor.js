import express from "express";
import {
  registerDoctor,
  getPendingDoctors,
  approveDoctor,
  getAllDoctors,
} from "../Controllers/doctor.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Doctor Routes
 */

// 🩺 Register new doctor
router.post("/register",protect,authorizeRoles("admin"),registerDoctor
);

// 📋 Get pending doctors
router.get("/pending",protect,authorizeRoles("admin"),getPendingDoctors
);

// ✅ Approve doctor
router.put("/approve/:id",protect,authorizeRoles("admin"),approveDoctor
);

// 📄 Get all doctors
router.get("/",protect,authorizeRoles("admin", "receptionist"),getAllDoctors
);

export default router;
