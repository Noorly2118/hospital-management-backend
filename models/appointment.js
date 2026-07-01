// models/Appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // === PATIENT ===
    patientName: { type: String, required: true, trim: true },
    patientEmail: { type: String, required: true, lowercase: true, trim: true },

    // === DOCTOR () ===
    doctorName: { type: String, required: true, trim: true },
    doctorEmail: { type: String, required: true, lowercase: true, trim: true },

    // === DATE & TIME ===
    date: { type: Date, required: true },
    time: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },

    // === OTHER ===
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "in-consultation", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Index for fast lookup by doctor + date + time
appointmentSchema.index({ doctorEmail: 1, date: 1, time: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;