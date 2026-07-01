import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import flash from "connect-flash";

import passport from "./config/passport.js";
import connectDB from "./config/dbconfig.js";

import userRoutes from "./routes/user.js";
import receptionistRoutes from "./routes/receptionist.js";
import doctorRoutes from "./routes/doctor.js";
import appointmentRoute from "./routes/appointment.js";
import consultationRoutes from "./routes/Consultation.js";
import labRoutes from "./routes/lab.js";
import paymentRoutes from "./routes/payment.js";
import AdminRoutes from "./routes/auth.js";

// Load environment variables
dotenv.config();

const app = express();

// =============================
// Middleware
// =============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Flash
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Passport
app.use(passport.initialize());
// app.use(passport.session());

// =============================
// Routes
// =============================

app.use("/api/users", userRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoute);
app.use("/api/consultations", consultationRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", AdminRoutes);

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hospital Management System API is running.",
  });
});

// =============================
// Database Connection
// =============================

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => {
      console.log("=================================");
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("=================================");
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:");
    console.error(err);
    process.exit(1);
  });