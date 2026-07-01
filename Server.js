// Backend/Server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import flash from "connect-flash";
import passport from "./config/passport.js";
import userRoutes from "./routes/user.js";
import connectDB from "./config/dbconfig.js";
import receptionistRoutes from "./routes/receptionist.js";
import doctorRoutes from "./routes/doctor.js";
import appointmentRoute from "./routes/appointment.js";
import consultationRoutes from "./routes/Consultation.js";
import labRoutes from "./routes/lab.js";
import paymentRoutes from "./routes/payment.js";
import AdminRoutes from "./routes/auth.js"




// Hardcoded environment variables
const env = {
  PORT: 4000,
  SESSION_SECRET: "your-secret-key",
  JWT_SECRET: "super_secret_jwt_key",
  GOOGLE_CLIENT_ID: "234761518387-qr98oluu0u9p2ud9m53r3n8oh5t2q723.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "GOCSPX-KK466t-xxxxxxxxxxxx",
  GOOGLE_CALLBACK_URL: "http://localhost:4000/auth/google/callback",
  FRONTEND_URL: "http://localhost:3000"
};

console.log("Environment variables:", env);

const app = express();

// Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// Session middleware
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Flash middleware
app.use(flash());

// Make flash messages available
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Initialize Passport
app.use(passport.initialize());
// app.use(passport.session()); // Disabled for testing
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments",appointmentRoute)
app.use("/api/consultations", consultationRoutes);
app.use("/api/lab", labRoutes); 
app.use("/api/payments", paymentRoutes);
app.use("/api/admin",AdminRoutes);



// Database Connection
connectDB()
  .then(() => {
    const PORT = env.PORT;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log("Passport strategies:", Object.keys(passport._strategies));
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });