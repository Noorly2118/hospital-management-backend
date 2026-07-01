import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
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

    /* =========================
       🩺 SUBJECTIVE (S)
    ========================= */
    chiefComplaint: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: {
      type: [String],
      default: [],
    },

    historyOfPresentIllness: {
      type: String,
      trim: true,
    },

    /* =========================
       🔍 OBJECTIVE (O)
    ========================= */
    vitalSigns: {
      temperature: Number,
      tempUnit: {
        type: String,
        enum: ["C", "F"],
        default: "C",
      },
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
      },
      pulse: Number,
      oxygenSaturation: Number, // SpO2 %
    },

    physicalExamination: {
      type: String,
      trim: true,
    },

    /* =========================
       🧪 LABS
    ========================= */
    labTests: [
      {
        testName: { type: String, required: true },
        loincCode: String,
        status: {
          type: String,
          enum: ["requested", "completed"],
          default: "requested",
        },
        result: String,
        attachmentUrl: String,
      },
    ],

    /* =========================
       🧠 ASSESSMENT (A)
    ========================= */
    assessment: {
      workingDiagnosis: String,
      confirmedDiagnosis: String,
      icdCode: String,
      differentialDiagnosis: [String],
    },

    /* =========================
       💊 PLAN (P)
    ========================= */
    prescriptions: [
      {
        medicine: { type: String, required: true },
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],

    files: {
      type: [String],
      default: [],
    },

    /* =========================
       🔒 FINALIZATION
    ========================= */
    isFinalized: {
      type: Boolean,
      default: false,
    },

    finalizedAt: Date,

    status: {
      type: String,
      enum: ["open", "in-progress", "awaiting-labs", "completed"],
      default: "open",
    },
  },
  { timestamps: true }
);

// 📌 Index for fast patient history lookup
consultationSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model("Consultation", consultationSchema);
