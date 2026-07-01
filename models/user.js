// models/User.js
import mongoose from "mongoose"
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ["patient", "doctor", "receptionist", "admin","labtech","cashier"], default: "patient" },
  status: { type: String, enum: ["pending", "active"], default: "pending" },
  googleId: { type: String },
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;