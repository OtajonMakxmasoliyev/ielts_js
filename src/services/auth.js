import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const ACCESS_SECRET = process.env.ACCESS_SECRET || "accesssecret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

const accessToken = (user) => {
    const access_token = jwt.sign(
        { id: user._id, role: user.role },
        ACCESS_SECRET,
        { expiresIn: "15m" }
    );

    return access_token

}

const refreshToken = (user, deviceId) => {
    const refresh_token = jwt.sign(
        { id: user._id, deviceId },
        REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    return refresh_token

}





export async function register(email, password, deviceId) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, });
    const access_token = accessToken(user)

    user.devices.push({
        deviceId, token: access_token, lastUsed: new Date()
    })
    await user.save()
    const { role } = user.toJSON()
    return { email, role, access_token };
}

export async function login(email, password, deviceId) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid password");

    // refresh va access tokenlarni yaratamiz
    const refresh_token = refreshToken(user, deviceId);
    const access_token = accessToken(user);

    if (!user.devices.length) {
        user.devices.push({ deviceId, lastUsed: new Date(), token: refresh_token })

    } else {
        // qurilma mavjudmi tekshiramiz
        const existing = user.devices.find(d => d.deviceId === deviceId);

        if (existing) {
            existing.token = refresh_token;
        } else {
            return {
                redirect: "REFRESH_DEVICES"
            }
        }

    }


    // o‘zgarishlarni bazaga saqlash
    await user.save();

    return {
        access_token,
        refresh_token,
        email: user.email,
    };
}

export async function refresh(userId, refreshToken, deviceId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");


    // faqat shu ip+userAgent va token mos bo‘lsa yangilanadi
    const device = user.devices.find(
        d => d.deviceId === deviceId
    );
    if (!device) throw new Error("Invalid refresh token");

    // yangilash
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        ACCESS_SECRET,
        { expiresIn: "15m" }
    );
    device.lastUsed = new Date();
    await user.save();

    return { accessToken };
}



export async function getDevices({ email }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");
    const devices = user.devices;

    return { devices }
}



export async function deleteDevices({
    deviceId,
    email,
}) {
    const user = await User.findOneAndUpdate(
        { email },
        { $pull: { devices: { deviceId } } }, // devices massivdan deviceId’ga mos kelgan elementni o‘chiradi
        { new: true } // yangilangan hujjatni qaytaradi
    );

    if (!user) throw new Error("User not found");

    return { success: true };
}