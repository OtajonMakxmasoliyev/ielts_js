import { Schema, model } from "mongoose";

const DeviceSchema = new Schema({
    token: { type: String, required: true },
    deviceId: { type: String, required: true },
    lastUsed: { type: Date, default: Date.now },
});

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },

    // Local auth uchun
    passwordHash: { type: String }, // required: false qilindi (Google user uchun)

    // Auth turi
    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },

    // Google auth uchun
    googleId: { type: String },
    fullName: { type: String },
    avatar: { type: String },

    role: { type: String, default: "student" },
    active: { type: Boolean, default: true },

    // Local (OTP) flow uchun
    isVerified: { type: Boolean, default: false }, // Email tasdiqlanganligi
    otp: { type: String }, // OTP kod
    otpExpires: { type: Date }, // OTP muddati
    answers: [
        {
            type: Schema.Types.Mixed // Bu joyga istalgan JSON/Object qabul qilinadi
        }
    ],
    // devices: [DeviceSchema]
}, { timestamps: true });

export default model("User", UserSchema);
