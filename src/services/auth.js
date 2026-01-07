import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {ERROR_TYPE} from "../enums/error.enum.js";
import Subscription from "../models/Subscription.js";
import Tarif from "../models/Tarif.js";
import Promo from "../models/Promo.js";

const ACCESS_SECRET = process.env.ACCESS_SECRET || "accesssecret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

const accessToken = (user) => {
    const access_token = jwt.sign({id: user._id, role: user.role}, ACCESS_SECRET, {expiresIn: "1d"});

    return access_token

}

const refreshToken = (user,) => {
    const refresh_token = jwt.sign({id: user._id,}, REFRESH_SECRET, {expiresIn: "7d"});

    return refresh_token

}


// export async function register(email, password, deviceId) {
export async function register(email, password, promoCode = null) {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({email, passwordHash});
        let promoApplied = false;
        // console.log(promoCode)
        if (promoCode) {
            // Promokodni bazadan qidirish
            const promo = await Promo.findOne({
                code: promoCode.toUpperCase(), active: true, expire_date: {$gt: new Date()}
            });

            if (promo) {
                // A. Yangi ro'yxatdan o'tgan foydalanuvchiga tarif berish (ixtiyoriy)
                const baseTarif = await Tarif.findById(promo.tarifId);
                if (baseTarif) {
                    await Subscription.create({
                        userId: user._id,
                        tarifId: baseTarif._id,
                        type: baseTarif.type,
                        tests_count: baseTarif.tests_count,
                        active: true
                    });
                    promoApplied = true;
                }

                // B. Influencer (Promo egasi) uchun bonus hisoblash
                promo.used_count += 1;

                // Har X ta odam kelganda (masalan, har 3-chi, 6-chi, 9-chi...)
                if (promo.used_count % promo.required_referrals === 0) {
                    // 1. Mukofot paketini bazadan olamiz
                    const rewardTarif = await Tarif.findById(promo.rewardTarifId);

                    if (rewardTarif) {
                        // 2. Influencerning xuddi shu turdagi aktiv obunasini qidiramiz
                        let influencerSub = await Subscription.findOne({
                            userId: promo.ownerId, tarifId: rewardTarif._id, active: true
                        });

                        if (influencerSub) {
                            // Agar shu paketdan obunasi bo'lsa, testlar sonini qo'shamiz
                            influencerSub.tests_count += rewardTarif.tests_count;
                            await influencerSub.save();
                        } else {
                            // Agar obunasi bo'lmasa, yangi obuna yaratamiz
                            await Subscription.create({
                                userId: promo.ownerId,
                                tarifId: rewardTarif._id,
                                type: rewardTarif.type,
                                tests_count: rewardTarif.tests_count,
                                active: true,
                            });
                        }
                    }
                }

                // Promokodning o'zgarishlarini saqlaymiz (used_count oshgani uchun)
                await promo.save();
            }
        }
        const access_token = accessToken(user);
        await user.save();

        const {role} = user.toJSON();
        return {email, role, access_token};

    } catch (error) {
        if (error.code === 11000) {
            return {
                error: {
                    code: ERROR_TYPE.EXIST_USER, message: "User already exists"
                }
            };
        }
        throw error;
    }
}

// export async function login(email, password, deviceId) {
export async function login(email, password,) {
    const user = await User.findOne({email});
    if (!user) throw new Error("User not found");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid password");

    // refresh va access tokenlarni yaratamiz
    const refresh_token = refreshToken(user);
    const access_token = accessToken(user);

    // if (!user.devices.length) {
    //     user.devices.push({deviceId, lastUsed: new Date(), token: refresh_token})
    //
    // } else {
    //     // qurilma mavjudmi tekshiramiz
    //     const existing = user.devices.find(d => d.deviceId === deviceId);
    //
    //     if (existing) {
    //         existing.token = refresh_token;
    //     } else {
    //         return {
    //             redirect: "REFRESH_DEVICES"
    //         }
    //     }
    //
    // }


    // o‘zgarishlarni bazaga saqlash
    await user.save();

    return {
        access_token, refresh_token, email: user.email, role: user.role,
    };
}

// export async function refresh(userId, refreshToken, deviceId) {
export async function refresh(userId, refreshToken,) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");


    // // faqat shu ip+userAgent va token mos bo‘lsa yangilanadi
    // const device = user.devices.find(d => d.deviceId === deviceId);
    // if (!device) throw new Error("Invalid refresh token");

    // yangilash
    const accessToken = jwt.sign({id: user._id, role: user.role}, ACCESS_SECRET, {expiresIn: "15m"});
    device.lastUsed = new Date();
    await user.save();

    return {accessToken};
}


export async function getDevices({email}) {
    const user = await User.findOne({email});
    if (!user) throw new Error("User not found");
    const devices = user.devices;

    return {devices}
}


export async function deleteDevices({
                                        deviceId, email,
                                    }) {
    const user = await User.findOneAndUpdate({email}, {$pull: {devices: {deviceId}}}, // devices massivdan deviceId’ga mos kelgan elementni o‘chiradi
        {new: true} // yangilangan hujjatni qaytaradi
    );

    if (!user) throw new Error("User not found");

    return {success: true};
}