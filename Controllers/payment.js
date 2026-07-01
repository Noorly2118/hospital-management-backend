import Payment from "../models/payment.js";
import User from "../models/user.js";
import LabTest from "../models/lab.js"; 

// 🧾 1. Create a new payment (Receptionist / System)
export const createPayment = async (req, res) => {
  try {
    const {
      patientId,
      serviceType,
      amount,
      paymentMethod,
      referenceNumber,
    } = req.body;

    if (!patientId || !serviceType || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (paymentMethod !== "cash" && !referenceNumber) {
      return res.status(400).json({
        message: `${paymentMethod} payment requires a reference number`,
      });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const newPayment = await Payment.create({
      patient: patient._id,
      patientName: patient.name,
      patientEmail: patient.email,
      serviceType,
      amount,
      paymentMethod: paymentMethod || "cash",
      referenceNumber,
      status: "pending",
    });

    res.status(201).json({
      message: "Payment record created successfully",
      payment: newPayment,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 💰 2. Cashier confirms payment
export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body; 

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (!["cashier", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (payment.status === "paid") {
      return res.status(400).json({ message: "Payment already confirmed" });
    }

    payment.status = "paid";
    payment.paymentMethod = paymentMethod || payment.paymentMethod; 
    payment.confirmedBy = req.user._id;
    payment.confirmedAt = new Date();

    await payment.save();

    res.json({ message: "Payment confirmed successfully", payment });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// 🧍‍♂️ 3. Get all payments (Cashier / Admin)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// 🧾 4. Get payments by patient
export const getPaymentsByPatient = async (req, res) => {
  try {
    const { email } = req.params;

    const payments = await Payment.find({ patientEmail: email }).sort({
      createdAt: -1,
    });

    if (!payments.length) {
      return res.status(404).json({ message: "No payments found" });
    }

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔍 5. Get a single payment by ID
// Get a single payment receipt by ID with total amount for patient
export const getReceiptByPaymentId = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the main payment
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const userRole = req.user.role;
    const userId = String(req.user._id);
    const isOwner = String(payment.patient) === userId;

    // Authorization: Admin, Cashier, or the owning patient
    if (userRole !== "admin" && userRole !== "cashier" && !isOwner) {
      return res.status(403).json({
        message: "Access denied. Not authorized to view this receipt.",
      });
    }

    // Find all paid payments for this patient
    const patientPayments = await Payment.find({
      patient: payment.patient,
      status: "paid",
    });

    // Total amount
    const totalAmount = patientPayments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      mainPayment: payment,
      allPayments: patientPayments,
      totalAmount,
    });
  } catch (error) {
    console.error("Get receipt by payment ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



