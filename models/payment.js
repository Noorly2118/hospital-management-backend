import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },

    serviceType: {
      type: String,
      enum: ["registration", "consultation", "lab"],
      required: true,
    },

    serviceRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "serviceTypeRef",
    },

    serviceTypeRef: {
      type: String,
      enum: ["Consultation", "LabTest"],
    },

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "mobile", "bank"],
      default: "cash",
    },

    referenceNumber: {
      type: String,
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    confirmedAt: {
      type: Date,
    },

    receiptNo: {
      type: String,
      unique: true,
    },

    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// 🧾 Auto-generate receipt number
paymentSchema.pre("save", function (next) {
  if (!this.receiptNo && this.status === "paid") {
    this.receiptNo = `RCPT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    this.paidAt = new Date();
  }
  next();
});

paymentSchema.index({ status: 1 });
paymentSchema.index({ patientEmail: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
