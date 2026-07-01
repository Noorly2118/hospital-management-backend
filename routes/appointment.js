// routes/appointment.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authmiddleware.js";
import {
  createAppointment,
  cancelAppointment,
  getDoctorAppointments,
  getAdminAppointments,
  getReceptionistAppointments,
  getPatientAppointments,
  updateAppointmentStatus,
} from "../Controllers/appointment.js";

const router = express.Router();

// Receptionist creates an appointment
router.post("/create", protect, authorizeRoles("receptionist", "admin"), createAppointment);
// Cancel appointment (doctor, receptionist, or patient)
router.put("/cancel/:id",protect,authorizeRoles("admin", "doctor", "receptionist", "patient"),cancelAppointment);

// Doctor views appointments
router.get("/doctor", protect, authorizeRoles("doctor", "admin"), getDoctorAppointments);

router.get("/admin", protect, authorizeRoles("admin"), getAdminAppointments);

router.get("/receptionist", protect, authorizeRoles("receptionist"), getReceptionistAppointments);

// Patient views their appointments
router.get("/patient/:email", protect, authorizeRoles("patient", "admin"), getPatientAppointments);

// Update appointment status
router.put("/:id", protect, authorizeRoles("doctor", "receptionist", "admin"), updateAppointmentStatus);

export default router;
