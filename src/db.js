import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()
const MONGO_URI = process.env.MONGODB_LINK


export async function connectDB() {
    try {
        const uri = MONGO_URI || "mongodb://localhost:27017/mydb";

        await mongoose.connect(uri, {
            // yangi versiyalarda bu opsiyalar kerak emas, shunchaki connect yetarli
        });

        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1); // ulanishda xato bo‘lsa, serverni to‘xtatadi
    }
}
