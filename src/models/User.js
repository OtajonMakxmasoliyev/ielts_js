import { Schema, model, } from "mongoose";





const DeviceSchema = new Schema({
    token: { type: String, required: true },
    deviceId: { type: String, required: true },
    lastUsed: { type: Date, default: Date.now },
});



const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "student" },
    active: { type: Boolean, default: true },
    answers: [
        {
            type: Schema.Types.Mixed // Bu joyga istalgan JSON/Object qabul qilinadi
        }
    ],
    devices: [DeviceSchema]
}, { timestamps: true });

export default model("User", UserSchema);
