import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      default: "My Hospital",
    },
    logo: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "Africa/Addis_Ababa",
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "ETB",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);








