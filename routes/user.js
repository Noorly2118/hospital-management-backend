// Backend/routes/user.js
import express from "express";
import passport from "passport";
import { registerUser, getPendingUsers,getapprovedUsers, approveUser, loginUser ,getMyProfile,
   updateUserProfile ,getAllUsers,getUsersByRole,getUsersByRoleAndStatus,getUserById} from "../Controllers/user.js";
import { protect,authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Hardcoded environment variables
const env = {
  FRONTEND_URL: "http://localhost:3000"
};

// Local signup
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(env.FRONTEND_URL);
  }
);
router.get("/allusers", protect, authorizeRoles("admin", "receptionist"), getAllUsers);
router.get("/:id", protect, authorizeRoles("admin","receptionist"), getUserById);
// Get pending users (only admin or receptionist)
router.get("/pending", protect, authorizeRoles("admin", "receptionist"), getPendingUsers);
//get approveduser
router.get("/approve", protect, authorizeRoles("admin", "receptionist"), getapprovedUsers)
// Approve user
router.get("/role/:role", protect, authorizeRoles("admin"), getUsersByRole);

router.get("/role/:role/status/:status", protect, authorizeRoles("admin"), getUsersByRoleAndStatus);

router.put("/approve/:id", protect, authorizeRoles("admin", "receptionist"), approveUser);
// router.post("/contact", protect, sendMessage);


router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateUserProfile);


export default router;











































































