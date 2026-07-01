import bcrypt from "bcrypt";
import User from "../models/User.js";
import Settings from "../models/Setting.js";
import Appointment from "../models/appointment.js";
import Payment from "../models/payment.js";

// Centralized async error wrapper
const catchAsync = (fn) => (req, res, next) =>
  fn(req, res, next).catch((err) => {
    console.error("Admin Controller Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  });

// ======================
// Helper: get admin safely
// ======================
const findAdmin = async (adminId) => {
  return await User.findOne({ _id: adminId, role: "admin" });
};

// ======================
// Admin Profile
// ======================
export const getAdminProfile = catchAsync(async (req, res) => {
  const admin = await User.findOne({
    _id: req.user.id,
    role: "admin",
  }).select("-password");

  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  res.json({ success: true, data: admin });
});


export const updateAdminProfile = catchAsync(async (req, res) => {
  const allowedFields = ["name", "email", "phone"];

  const updates = Object.keys(req.body)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => ({ ...obj, [key]: req.body[key] }), {});

  const admin = await User.findOneAndUpdate(
    { _id: req.user.id, role: "admin" },
    updates,
    { new: true, runValidators: true }
  ).select("-password");

  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  res.json({ success: true, data: admin });
});

export const changeAdminPassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both passwords are required" });
  }

  const admin = await findAdmin(req.user.id);

  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  const isMatch = await bcrypt.compare(oldPassword, admin.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Incorrect old password" });
  }

  admin.password = await bcrypt.hash(newPassword, 12);
  await admin.save();

  res.json({ success: true, message: "Password updated successfully" });
});

// ======================
// System Settings
// ======================
export const getSystemSettings = catchAsync(async (req, res) => {
  const settings = (await Settings.findOne()) || {};
  res.json({ success: true, data: settings });
});

export const updateSystemSettings = catchAsync(async (req, res) => {
  const allowed = [
    "hospitalName",
    "contactEmail",
    "phone",
    "logoUrl",
    "workingHours",
    "defaultLanguage",
    "currency",
    "timezone"
  ];

  const updates = Object.keys(req.body)
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => ({ ...obj, [key]: req.body[key] }), {});

  const settings = await Settings.findOneAndUpdate({}, updates, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  res.json({ success: true, data: settings });
});

// ======================
// User Management
// ======================
export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ success: false, message: "Role is required" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, ...(role === "doctor" && { approved: true }) },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, data: user });
});

export const updateUserStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  if (!["active", "inactive", "banned"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, data: user });
});

// ======================
// Security Settings
// ======================
export const getSecurityRules = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      twoFactorAuth: false,         
      loginAlerts: true,            
      maxLoginAttempts: 5,          
      passwordExpiryDays: 90,       
      enforceStrongPassword: true,  
    }
  });
};

export const toggleTwoFactorAuth = catchAsync(async (req, res) => {
  const { enabled } = req.body;

  const admin = await findAdmin(req.user.id);
  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  admin.twoFactorEnabled = Boolean(enabled);
  await admin.save();

  res.json({ success: true, data: { twoFactorEnabled: admin.twoFactorEnabled } });
});

// ======================
// Backup
// ======================
export const triggerBackup = catchAsync(async (req, res) => {
  // TODO: integrate backup service
  res.json({ success: true, message: "Backup process started successfully" });
});

// ======================
// Dashboard Statistics
// ======================
export const getAdminStats = catchAsync(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [userStats, todayAppointments, payments] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          totalPatients: { $sum: { $cond: [{ $eq: ["$role", "patient"] }, 1, 0] } },
          totalDoctors:  { $sum: { $cond: [{ $eq: ["$role", "doctor"] }, 1, 0] } },
          pendingDoctors: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$role", "doctor"] }, { $eq: ["$approved", false] }] },
                1,
                0
              ]
            }
          },
        },
      },
    ]),

    Appointment.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }),

    Payment.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, status: "completed" } },
      { $group: { _id: null, revenue: { $sum: "$amount" } } },
    ])
  ]);

  const revenueToday = payments[0]?.revenue || 0;
  const stats = userStats[0] || { totalPatients: 0, totalDoctors: 0, pendingDoctors: 0 };

  res.json({
    success: true,
    data: {
      totalPatients: stats.totalPatients,
      totalDoctors: stats.totalDoctors,
      pendingRegistrations: stats.pendingDoctors,
      todaysAppointments: todayAppointments,
      revenueToday,
      activeUsersNow: await User.countDocuments({
        lastSeen: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      }),
    },
  });
});

// ======================
// All Appointments (Admin)
// ======================
export const getAllAppointmentsForAdmin = catchAsync(async (req, res) => {
  const appointments = await Appointment.find()
    .populate("patientId", "name email phone")
    .populate("doctorId", "name specialty")
    .sort({ date: -1, time: -1 })
    .lean();

  const formatted = appointments.map((apt) => ({
    _id: apt._id,
    patient: apt.patientId
      ? `${apt.patientId.name} (${apt.patientId.email})`
      : "Deleted Patient",
    doctor: apt.doctorId
      ? `${apt.doctorId.name} - ${apt.doctorId.specialty || "General"}`
      : "Unassigned",
    date: apt.date.toISOString().split("T")[0],
    time:
      apt.time ||
      new Date(apt.date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    status: apt.status || "scheduled",
    fee: apt.fee || 0,
    createdAt: apt.createdAt,
  }));

  res.json({ success: true, data: formatted });
});
