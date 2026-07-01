// controllers/appointment.js
import Appointment from "../models/appointment.js";
import Doctor from "../models/doctor.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const createAppointment = async (req, res) => {
  try {
    const { patientEmail, doctorEmail, date, time, reason } = req.body;

    // === VALIDATION ===
    if (!patientEmail || !doctorEmail || !date || !time) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Time must match 24-hour HH:MM format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        message: "Invalid time format. Use HH:MM (24-hour format).",
      });
    }

    // === FIND PATIENT ===
    const patient = await User.findOne({
      email: patientEmail.trim().toLowerCase(),
      role: "patient",
      status: "active",
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // === FIND DOCTOR ===
    const doctor = await Doctor.findOne({
      email: doctorEmail.trim().toLowerCase(),
    });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // === CHECK FOR SCHEDULE CONFLICT ===
    const appointmentDate = new Date(date);

    const existing = await Appointment.findOne({
      doctorEmail: doctor.email,
      date: appointmentDate,
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existing) {
      return res.status(400).json({
        message: `Doctor is already booked at ${time} on ${appointmentDate.toDateString()}`,
      });
    }

    // === CREATE APPOINTMENT (FULLY) ===
    const appointment = await Appointment.create({
      patientName: patient.name,
      patientEmail: patient.email,
      doctorName: doctor.name,
      doctorEmail: doctor.email,
      date: appointmentDate,
      time,
      reason,
      status: "pending", 
    });

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
    });

  } catch (error) {
    console.error("Create Appointment Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const canCancel =
      user.role === "admin" ||
      user.role === "receptionist" ||
      (user.role === "patient" && appointment.patientEmail === user.email) ||
      (user.role === "doctor" && appointment.doctorEmail === user.email);

    if (!canCancel) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Already cancelled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.json({
      success: true,
      message: "Appointment cancelled",
      appointment,
    });
  } catch (error) {
    console.error("Cancel error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorEmail = req.user.role === "doctor" 
      ? req.user.email 
      : req.params.email?.toLowerCase();

    if (!doctorEmail) {
      return res.status(400).json({ message: "Doctor email required" });
    }

    const appointments = await Appointment.find({
      doctorEmail,
      status: { $in: ["pending", "confirmed"] },
    }).sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminAppointments = async (req, res) => {
  try {
    // Admin sees ALL doctors' appointments
    const appointments = await Appointment.find({
      status: { $in: ["pending", "confirmed"] },
    }).sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Admin appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/receptionist.js or appointmentController.js
export const getReceptionistAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,   
    });
  } catch (error) {
    console.error("Error fetching receptionist appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPatientAppointments = async (req, res) => {
  try {
    const patientEmail = req.params.email?.toLowerCase();
    if (!patientEmail) {
      return res.status(400).json({ message: "Patient email required" });
    }

    const appointments = await Appointment.find({ 
      patientEmail,
      status: { $in: ["pending", "confirmed", "cancelled"] }
    }).sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Not found" });

    const isDoctor = req.user.role === "doctor" && appointment.doctorEmail === req.user.email;
    const isReceptionist = req.user.role === "receptionist";

    if (!isDoctor && !isReceptionist) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (isReceptionist && status === "confirmed") {
      return res.status(403).json({ message: "Receptionist cannot confirm" });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      success: true,
      message: `Appointment ${status}`,
      appointment,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};