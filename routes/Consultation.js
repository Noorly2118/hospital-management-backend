import express from "express";
import {
  startConsultationFromAppointment,
  updateConsultation,
  requestLabTest,
  uploadLabResult,
  addPrescription,
  finalizeConsultation,
  getConsultationById,
  getConsultationsByPatient,
} from "../Controllers/Consultation.js";

import { protect, authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

/* ======================================================
   🟢 CONSULTATION CREATION
====================================================== */

// 1️⃣ Doctor starts consultation from appointment
router.post(
  "/start/:appointmentId",
  protect,
  authorizeRoles("doctor"),
  startConsultationFromAppointment
);

/* ======================================================
   🩺 DOCTOR WORKFLOW (SOAP)
====================================================== */

// 2️⃣ Doctor updates consultation (SOAP data)
router.put(
  "/:id",
  protect,
  authorizeRoles("doctor"),
  updateConsultation
);

// 5️⃣ Doctor adds prescription
router.put(
  "/:id/prescriptions",
  protect,
  authorizeRoles("doctor"),
  addPrescription
);

// 6️⃣ Doctor finalizes consultation (LOCK)
router.put(
  "/:id/finalize",
  protect,
  authorizeRoles("doctor"),
  finalizeConsultation
);

/* ======================================================
   🧪 LAB WORKFLOW
====================================================== */

// 3️⃣ Doctor requests lab test
router.put(
  "/:id/labs",
  protect,
  authorizeRoles("doctor"),
  requestLabTest
);

// 4️⃣ Lab technician uploads lab result
router.put(
  "/labs/:labTestId/result",
  protect,
  authorizeRoles("labtech"),
  uploadLabResult
);

/* ======================================================
   📚 HISTORY & VIEW
====================================================== */

// 8️⃣ View single consultation (doctor or patient)
router.get(
  "/:id",
  protect,
  getConsultationById
);

// 7️⃣ Patient medical history
router.get(
  "/patient/me",
  protect,
  authorizeRoles("patient"),
  getConsultationsByPatient
);
// Get my consultations (patient or doctor)
router.get("/me", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "patient") {
      query = { patient: req.user._id };
    } else if (req.user.role === "doctor") {
      query = { doctor: req.user._id };
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    const consultations = await Consultation.find(query)
      .sort({ createdAt: -1 })
      .populate("patient", "name email phone")
      .populate("doctor", "name specialization")
      .populate("appointment");

    res.json(consultations);
  } catch (error) {
    console.error("Error in /me:", error);
    res.status(500).json({ message: "Server error fetching consultations" });
  }
});

export default router;
