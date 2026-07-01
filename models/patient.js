import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "active"], default: "pending" }, 
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
