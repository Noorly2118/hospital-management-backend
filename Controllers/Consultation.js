// Controllers/Consultation.js
import mongoose from "mongoose";
import Consultation from "../models/Consultation.js";
import Appointment from "../models/appointment.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ======================================================
1️⃣ START CONSULTATION FROM APPOINTMENT
====================================================== */
export const startConsultationFromAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { appointmentId } = req.params;

    if (!isValidId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(appointmentId).session(session);
    if (!appointment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Prevent duplicate consultation
    const existing = await Consultation.findOne({ appointment: appointmentId }).session(session);
    if (existing) {
      await session.commitTransaction(); // Not an error, just return existing
      return res.status(200).json(existing);
    }

    const consultation = await Consultation.create([{
      appointment: appointment._id,
      patient: appointment.patientId,
      doctor: req.user._id,
      chiefComplaint: appointment.reason || "Not specified",
      status: "open",
    }], { session });

    // Update appointment status to link it
    appointment.status = "in-consultation";
    await appointment.save();

    await session.commitTransaction();
    res.status(201).json({ message: "Consultation started", consultation: consultation[0] });
  } catch (error) {
    await session.abortTransaction();
    console.error("Start Consultation Error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
};

/* ======================================================
2️⃣ UPDATE CONSULTATION (SOAP – DOCTOR)
====================================================== */
export const updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id);

    if (!consultation) return res.status(404).json({ message: "Not found" });
    
    // SECURITY LOCK
    if (consultation.isFinalized) {
      return res.status(403).json({ message: "Record is finalized and cannot be edited" });
    }

    const updates = req.body;

    // DEEP MERGE NESTED OBJECTS (Vital Signs & Assessment)
    // This prevents overwriting the entire object if only one field is sent
    if (updates.vitalSigns) {
      consultation.vitalSigns = { ...consultation.vitalSigns?.toObject(), ...updates.vitalSigns };
      delete updates.vitalSigns;
    }
    if (updates.assessment) {
      consultation.assessment = { ...consultation.assessment?.toObject(), ...updates.assessment };
      delete updates.assessment;
    }

    Object.assign(consultation, updates);
    
    // Auto-update status if it was just "open"
    if (consultation.status === "open") consultation.status = "in-progress";

    await consultation.save();
    res.json({ message: "Consultation updated", consultation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed" });
  }
};

/* ======================================================
3️⃣ DOCTOR ORDERS LAB TEST
====================================================== */
export const requestLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id);

    if (!consultation) return res.status(404).json({ message: "Not found" });
    
    // SECURITY LOCK
    if (consultation.isFinalized) {
      return res.status(403).json({ message: "Cannot order tests for a finalized record" });
    }

    consultation.labTests.push({
      ...req.body,
      status: "requested",
    });

    consultation.status = "awaiting-labs";
    await consultation.save();

    res.json({ message: "Lab test ordered", consultation });
  } catch (error) {
    res.status(500).json({ message: "Failed to order lab test" });
  }
};

/* ======================================================
4️⃣ LAB TECH UPLOADS RESULT
====================================================== */
export const uploadLabResult = async (req, res) => {
  try {
    const { labTestId } = req.params;
    const { result, attachmentUrl } = req.body;

    const consultation = await Consultation.findOne({ "labTests._id": labTestId });
    if (!consultation) return res.status(404).json({ message: "Lab test not found" });

    const labTest = consultation.labTests.id(labTestId);
    labTest.result = result;
    labTest.attachmentUrl = attachmentUrl;
    labTest.status = "completed";

    // Set status back to in-progress so doctor knows results are in
    consultation.status = "in-progress";

    await consultation.save();
    res.json({ message: "Lab result uploaded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ======================================================
5️⃣ DOCTOR ADDS PRESCRIPTION
====================================================== */
export const addPrescription = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ message: "Not found" });

    // SECURITY LOCK
    if (consultation.isFinalized) {
      return res.status(403).json({ message: "Record locked" });
    }

    consultation.prescriptions.push(req.body);
    await consultation.save();

    res.json({ message: "Prescription added", consultation });
  } catch (error) {
    res.status(500).json({ message: "Failed to add prescription" });
  }
};

/* ======================================================
6️⃣ FINALIZE CONSULTATION (LOCK RECORD)
====================================================== */
export const finalizeConsultation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id).session(session);

    if (!consultation) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Check if diagnosis exists before finalizing
    if (!consultation.assessment?.workingDiagnosis && !consultation.assessment?.confirmedDiagnosis) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Diagnosis required to finalize" });
    }

    consultation.isFinalized = true;
    consultation.finalizedAt = new Date();
    consultation.status = "completed";
    await consultation.save();

    // Atomic update to the appointment status
    await Appointment.findByIdAndUpdate(
      consultation.appointment, 
      { status: "completed" },
      { session }
    );

    await session.commitTransaction();
    res.json({ message: "Consultation finalized and locked", consultation });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Finalization failed" });
  } finally {
    session.endSession();
  }
};

/* ======================================================
7️⃣ GETTERS (HISTORY & VIEW)
====================================================== */
export const getConsultationsByPatient = async (req, res) => {
  try {
    const consultations = await Consultation.find({ patient: req.user._id })
      .sort({ createdAt: -1 })
      .populate("doctor", "name specialization");
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
};

export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate("patient", "name email phone dob gender")
      .populate("doctor", "name specialization")
      .populate("appointment");

    if (!consultation) return res.status(404).json({ message: "Not found" });
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
