// Backend/config/dbconfig.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = "mongodb+srv://noorly21118_db_user:hmspassword@cluster0.1hzbpdo.mongodb.net/?appName=Cluster0";
    console.log("MONGO_URI:", uri);
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;