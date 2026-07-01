import Doctor from "../models/doctor.js";
import User from "../models/user.js";

// 🧾 Register new doctor (Admin adds, or doctor self-registers)
export const registerDoctor = async (req, res) => {
  try {
    const { name, email, specialty, experience, phone, availableDays, consultationFee } = req.body;

    // 1. Find doctor user (must exist and be pending)
    const user = await User.findOne({ email, role: "doctor" });
    if (!user) {
      return res.status(404).json({
        message: "Doctor must first register as a user (role: doctor)",
      });
    }

    if (user.status === "active") {
      return res.status(400).json({
        message: "Doctor is already active.",
      });
    }

    // 2. Prevent duplicate profile
    const existingDoctor = await Doctor.findOne({ userId: user._id });
    if (existingDoctor) {
      return res.status(400).json({
        message: "Doctor profile already exists.",
      });
    }

    // 3. Create doctor profile
    const newDoctor = new Doctor({
      userId: user._id,
      name: name || user.name,
      email: user.email,
      specialty,
      experience,
      phone,
      availableDays,
      consultationFee,
    });

    await newDoctor.save();

    // AUTO-APPROVE USER
    await User.findByIdAndUpdate(user._id, { status: "active" });

    res.status(201).json({
      success: true,
      message: "Doctor registered and approved successfully",
      doctor: newDoctor,
    });
  } catch (error) {
    console.error("registerDoctor error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const msg = field === "phone" ? "Phone" : "Profile";
      return res.status(400).json({ message: `${msg} already in use` });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 📋 Get pending doctors
export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "pending" });
    res.json(doctors);
  } catch (error) {
    console.error("❌ getPendingDoctors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Approve doctor (Admin only)
export const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByIdAndUpdate(id, { status: "active" }, { new: true });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Activate linked user account
    await User.findByIdAndUpdate(doctor.userId, { status: "active" });

    res.json({ message: "Doctor approved successfully", doctor });
  } catch (error) {
    console.error("❌ approveDoctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📄 Get all doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("userId", "name email role status");
    res.json(doctors);
  } catch (error) {
    console.error("❌ getAllDoctors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
