import express from "express";
import { protect, authorizeRoles } from "../middleware/authmiddleware.js";

import { getAdminStats } from "../Controllers/auth.js";

import {getAdminProfile,updateAdminProfile,changeAdminPassword,getSystemSettings,updateSystemSettings,getAllUsers,updateUserRole,updateUserStatus,toggleTwoFactorAuth,triggerBackup,getAllAppointmentsForAdmin,getSecurityRules 

} from "../Controllers/Setting.js";

const router = express.Router();

router.get("/stats", protect, authorizeRoles("admin"), getAdminStats);

router.get("/profile", protect, authorizeRoles("admin"), getAdminProfile);
router.put("/profile/update", protect, authorizeRoles("admin"), updateAdminProfile);
router.put("/profile/password", protect, authorizeRoles("admin"), changeAdminPassword);

router.get("/settings/system", protect, authorizeRoles("admin"), getSystemSettings);
router.put("/settings/system", protect, authorizeRoles("admin"), updateSystemSettings);

router.get("/users", protect, authorizeRoles("admin"), getAllUsers);
router.put("/users/:id/role", protect, authorizeRoles("admin"), updateUserRole);
router.put("/users/:id/status", protect, authorizeRoles("admin"), updateUserStatus);

router.put("/security/2fa", protect, authorizeRoles("admin"), toggleTwoFactorAuth);

router.post("/backup", protect, authorizeRoles("admin"), triggerBackup);

router.get("/appointments/all", protect, authorizeRoles("admin"), getAllAppointmentsForAdmin);

router.get("/security/rules", protect, authorizeRoles("admin"), getSecurityRules);


export default router;
