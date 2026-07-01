// models/LabTest.js
import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    // === CORE IDENTIFIERS (Never change) ===
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // === DISPLAY SNAPSHOTS (Set once, never used for lookup) ===
    patientName: { type: String, required: true },
    patientEmail: { type: String, trim: true, lowercase: true },
    doctorName: { type: String, required: true },
    doctorEmail: { type: String, trim: true, lowercase: true },

    // === TEST DETAILS ===
    testName: { type: String, required: true, trim: true },
    sampleId: {
      type: String,
      unique: true,
      sparse: true, // allows null until assigned
    },

    result: { type: String },
    resultFile: { type: String }, // URL to PDF/image

    status: {
      type: String,
      enum: [
        "requested",
        "sample-collected",
         "reviewing-results",
        "in-lab",
        "completed",
        "rejected",
        "verified",
      ],
      default: "requested",
    },

    // === AUDIT ===
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedAt: { type: Date, default: Date.now },

    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    performedAt: { type: Date },

    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },

    notes: { type: String },
  },
  { timestamps: true }
);

// === INDEXES ===
labTestSchema.index({ consultation: 1, testName: 1 }, { unique: true }); // No duplicate test
labTestSchema.index({ sampleId: 1 });
labTestSchema.index({ patient: 1, createdAt: -1 });
labTestSchema.index({ status: 1, createdAt: -1 });

// === AUTO-GENERATE SAMPLE ID ===
labTestSchema.pre("save", function (next) {
  if (!this.sampleId && this.status === "sample-collected") {
    this.sampleId = `LAB-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-6)}`;
  }
  if (this.isModified("status") && this.status === "completed") {
    this.performedAt = this.performedAt || new Date();
  }
  next();
});

export default mongoose.model("LabTest", labTestSchema);