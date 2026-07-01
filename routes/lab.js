// routes/lab.js
import express from "express";
import {
  getAllLabTests,
  getPendingLabTests,
  reviewLabRequest,
  uploadLabResult,
  getPatientLabTests,
} from "../Controllers/lab.js";
import { protect, authorizeRoles } from "../middleware/authmiddleware.js";

const router = express.Router();

// 1️⃣ View all lab tests (for admin or labtech)
router.get( "/", protect, authorizeRoles("labtech", "admin"), getAllLabTests
);

// 2️⃣ View only pending requests (not yet reviewed)
router.get( "/pending", protect, authorizeRoles("labtech", "admin"), getPendingLabTests
);

// 3️⃣ Review lab request (mark available/unavailable)
router.put("/:id/review",protect,authorizeRoles("labtech", "admin"),reviewLabRequest
);

// 4️⃣ Upload lab results (after payment confirmed)
router.put( "/:id/result", protect, authorizeRoles("labtech"), uploadLabResult
);

// 5️⃣ View all lab tests for a specific patient
router.get("/patient/:patientId",protect,authorizeRoles("doctor", "patient", "admin","labtech"),getPatientLabTests
);

export default router;
