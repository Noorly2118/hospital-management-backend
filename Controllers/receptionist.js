import Patient from "../models/patient.js";
import User from "../models/User.js";
import Payment from "../models/payment.js"; // adjust path if needed


// 🧍‍♀️ Register a new patient (done by receptionist)
export const registerPatient = async (req, res) => {
  try {
    const { name, email, age, gender, address, phone } = req.body;

    // 1. Check if email already used in User collection
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // 2. Create user account
    const newUser = await User.create({
      name,
      email,
      role: "patient",
      status: "pending",
      password: "patient123", // you can change or auto-generate
    });

    // 3. Create patient profile
    const newPatient = await Patient.create({
      userId: newUser._id,
      name,
      email,
      age,
      gender,
      address,
      phone,
    });

    // 4. Create pending registration payment
    const registrationFee =
      process.env.REGISTRATION_FEE ? Number(process.env.REGISTRATION_FEE) : 50;

    const regPayment = await Payment.create({
      patient: newUser._id,
      patientName: newUser.name,
      patientEmail: newUser.email,
      serviceType: "registration",
      amount: registrationFee,
      status: "pending", // receipt generated only when paid
    });

    res.status(201).json({
      success: true,
      message: "Patient registered successfully; registration payment pending",
      patient: newPatient,
      registrationPayment: regPayment,
    });

  } catch (error) {
    console.error("registerPatient error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Phone or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// 📋 Get all pending patients (waiting for approval)
export const getPendingPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ status: "pending" });
    res.status(200).json(patients);
  } catch (error) {
    console.error("❌ getPendingPatients error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Approve patient
export const approvePatient = async (req, res) => {
  try {
    const { id } = req.params; // patient ID from URL
    const patient = await Patient.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Also activate linked user
    await User.findByIdAndUpdate(patient.userId, { status: "active" });

    res.status(200).json({ message: "Patient approved successfully", patient });
  } catch (error) {
    console.error("❌ approvePatient error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📄 Get all active patients
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate("_id", "name email role status");
    res.status(200).json(patients);
  } catch (error) {
    console.error("❌ getAllPatients error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
