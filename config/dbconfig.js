// Backend/config/dbconfig.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = "mongodb://127.0.0.1:27017/hms";
    console.log("MONGO_URI:", uri);
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;