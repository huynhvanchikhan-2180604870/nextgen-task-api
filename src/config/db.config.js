import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/task_manager";
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (e) {
    console.error("MongoDB connection error", e);
    process.exit(1);
  }
}
