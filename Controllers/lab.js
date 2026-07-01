// controllers/lab.js
import LabTest from "../models/lab.js";
import Consultation from "../models/Consultation.js";
import Payment  from  "../models/payment.js"

// 1️⃣ View all lab test requests (lab technician or admin)
export const getAllLabTests = async (req, res) => {
  try {
    const labTests = await LabTest.find()
      .select("testName status result sampleId patientName doctorName requestedAt")
      .sort({ requestedAt: -1 });
    res.json(labTests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2️⃣ View pending lab tests (status = "requested")
export const getPendingLabTests = async (req, res) => {
  try {
    const pending = await LabTest.find({ status: "requested" })
      .select("testName patientName doctorName consultation")
      .sort({ requestedAt: 1 });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3️⃣ Lab Tech reviews test → decides if hospital can perform it
export const reviewLabRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body; // true = hospital can do it
    const labTest = await LabTest.findById(id);
    if (!labTest) return res.status(404).json({ message: "Lab test not found" });

    // ❌ If unavailable, mark as external
    if (!available) {
      labTest.status = "external";
      await labTest.save();
      return res.json({ message: "Marked as external — print lab request form", labTest });
    }

    // ✅ If available, create payment
    const labFee = process.env.LAB_FEE ? Number(process.env.LAB_FEE) : 100;
    const payment = new Payment({
      patient: labTest.patient,
      patientName: labTest.patientName,
      patientEmail: labTest.patientEmail,
      serviceType: `lab-${labTest.testName}`,
      amount: labFee,
      status: "pending",
    });
    await payment.save();

    labTest.status = "awaiting-payment";
    await labTest.save();

    res.json({ message: "Lab available — payment required", labTest, payment });
  } catch (error) {
    console.error("reviewLabRequest error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 4️⃣ Upload lab result (labtech)
export const uploadLabResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { result, resultFile } = req.body;

    if (!result) {
      return res.status(400).json({ message: "Result text is required" });
    }

    const labTest = await LabTest.findById(id);
    if (!labTest) return res.status(404).json({ message: "Lab test not found" });

    labTest.result = result;
    labTest.resultFile = resultFile || null;
    labTest.status = "completed";
    labTest.performedBy = req.user._id;
    labTest.performedAt = new Date();
    await labTest.save();

    // Check if all tests under the same consultation are done
    const allTests = await LabTest.find({ consultation: labTest.consultation });
    const allCompleted = allTests.every(t => t.status === "completed");

    if (allCompleted) {
      await Consultation.findByIdAndUpdate(labTest.consultation, { status: "results-ready" });
    }

    res.json({ message: "Lab result uploaded successfully", labTest });
  } catch (error) {
    console.error("uploadLabResult error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 5️⃣ Get lab tests for a specific patient
export const getPatientLabTests = async (req, res) => {
  try {
    const { patientId } = req.params;
    const tests = await LabTest.find({ patient: patientId })
      .select("testName status result resultFile doctorName requestedAt")
      .sort({ requestedAt: -1 });
    if (!tests.length) return res.status(404).json({ message: "No lab tests found" });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
