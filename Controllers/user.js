// Backend/controllers/user.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Payment from "../models/payment.js";

// Hardcoded environment variables
const env = {
  JWT_SECRET: "super_secret_jwt_key"
};

// Register (Sign Up)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      status: "pending",
    });

    await newUser.save();

    // Set registration fee
    const registrationFee =
      process.env.REGISTRATION_FEE ? Number(process.env.REGISTRATION_FEE) : 50;

    // Create pending payment for registration
    const regPayment = new Payment({
      patient: newUser._id,
      patientName: newUser.name,
      patientEmail: newUser.email,
      serviceType: "registration",
      amount: registrationFee,
      status: "pending", // NO receiptNo yet
    });

    await regPayment.save();

    res.status(201).json({
      message: "User registered; registration payment pending",
      user: newUser,
      registrationPayment: regPayment,
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


//get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get pending users (for approval)
export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "pending" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getapprovedUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "active" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
//
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params; // doctor, receptionist, patient...

    const users = await User.find({ role });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const getUsersByRoleAndStatus = async (req, res) => {
  try {
    const { role, status } = req.params;

    const users = await User.find({ role, status });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Approve user (Admin or Receptionist)
export const approveUser = async (req, res) => {
  try {
    const approver = req.user;
    const { id } = req.params;

    const userToApprove = await User.findById(id);
    if (!userToApprove)
      return res.status(404).json({ message: "User not found" });

    if (approver.role === "receptionist") {
      if (userToApprove.role !== "patient")
        return res
          .status(403)
          .json({ message: "Receptionist can only approve patients" });

      // 🧾 check if registration payment is paid
      const payment = await Payment.findOne({
        patient: userToApprove._id,
        serviceType: "registration",
      });

      if (!payment || payment.status !== "paid") {
        return res.status(400).json({
          message: "Patient cannot be approved until registration fee is paid",
        });
      }

      userToApprove.status = "active";
      await userToApprove.save();

      return res.json({ message: "Patient approved successfully" });
    }

    // 🧑‍💼 Admin approval (for staff roles)
    if (approver.role === "admin") {
      if (["receptionist", "doctor", "labtech", "cashier"].includes(userToApprove.role)) {
        userToApprove.status = "active";
        await userToApprove.save();
        return res.json({ message: `${userToApprove.role} approved successfully` });
      }
      return res
        .status(403)
        .json({ message: "Admin doesn't approve patients directly" });
    }

    res.status(403).json({ message: "You are not allowed to approve users" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("➡️ Login attempt for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", { email: user.email, password: user.password });
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch, "Input password:", password);
    if (!isMatch) {
      console.log("❌ Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status !== "active") {
      console.log("⚠️ Account not yet approved");
      return res.status(403).json({ message: "Account not yet approved" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("✅ Login successful:", user.email);
    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("🔥 Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// controllers/contactController.js

export const sendMessage = (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Log the message (replace with DB save if needed)
    console.log("New contact message:", { name, email, subject, message });

    return res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
