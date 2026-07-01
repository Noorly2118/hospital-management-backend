// models/Doctor.js
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One profile per doctor user
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    specialty: { type: String, required: true },
    experience: { type: Number, required: true, min: 0 },
    phone: { type: String, required: true, unique: true },
    availableDays: { type: [String], default: [] },
    consultationFee: { type: Number, required: true },
  },
  { timestamps: true }
);

// Ensure unique indexes
doctorSchema.index({ userId: 1 }, { unique: true });
doctorSchema.index({ phone: 1 }, { unique: true });

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;