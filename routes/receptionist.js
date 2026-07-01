import express from "express";
import {
  registerPatient,
  getPendingPatients,
  approvePatient,
  getAllPatients,
} from "../Controllers/receptionist.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Receptionist Routes
 * Accessible only to: admin and receptionist
 */

// 🧍‍♀️ Register a new patient
router.post(
  "/patients/register",
  protect,
  authorizeRoles("admin", "receptionist"),
  registerPatient
);

// 📋 Get all pending patients
router.get(
  "/patients/pending",
  protect,
  authorizeRoles("admin", "receptionist"),
  getPendingPatients
);

// ✅ Approve patient
router.put(
  "/patients/approve/:id",
  protect,
  authorizeRoles("admin", "receptionist"),
  approvePatient
);

// 📄 Get all patients (active, inactive, pending)
router.get(
  "/patients",
  protect,
  authorizeRoles("admin", "receptionist"),
  getAllPatients
);

export default router;
