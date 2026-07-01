import express from "express";
import {
  createPayment,
  confirmPayment,
  getAllPayments,
  getPaymentsByPatient,getReceiptByPaymentId
} from "../Controllers/payment.js";
import { protect, authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

// Receptionist or system can create payment
router.post("/", protect, authorizeRoles("receptionist", "admin"), createPayment);

// Cashier confirms
router.put("/confirm/:id",protect,authorizeRoles("cashier", "admin"),confirmPayment);
// Admin/Cashier can view all
router.get("/", protect, authorizeRoles("cashier", "admin"), getAllPayments);

// Patient can view their payments
router.get("/:email", protect, authorizeRoles("patient", "admin"), getPaymentsByPatient);

// router.get("/:id", protect, authorizeRoles("cashier", "admin", "patient") // Cashier needs this for ReceiptViewgetPaymentById
// );
router.get("/receipt/:id",protect,authorizeRoles("cashier", "admin", "patient"),getReceiptByPaymentId);
export default router;
