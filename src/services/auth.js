import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {ERROR_TYPE} from "../enums/error.enum.js";
import Subscription from "../models/Subscription.js";
import Tarif from "../models/Tarif.js";
import Promo from "../models/Promo.js";
import {generateOTP, getOTPExpiration, isOTPExpired} from "../utils/otp.js";
import {sendOTPEmail} from "../config/mail.js";

const ACCESS_SECRET = process.env.ACCESS_SECRET || "accesssecret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";

// Token yaratish funksiyalari
const createAccessToken = (user) => {
    return jwt.sign({id: user._id, role: user.role}, ACCESS_SECRET, {expiresIn: "1d"});
};

const createRefreshToken = (user) => {
    return jwt.sign({id: user._id}, REFRESH_SECRET, {expiresIn: "7d"});
};

// Promokod bilan ishlaydigan xizmat
class PromoService {
    /**
     * Promokodni tasdiqlash
     */
    static async validatePromo(code) {
        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            return null;
        }

        const promo = await Promo.findOne({
            code: code.trim().toUpperCase(),
            active: true,
            expire_date: {$gt: new Date()}
        }).populate('tarifId rewardTarifId');

        // Usage limit tekshiruvi
        if (promo && promo.usage_limit && promo.used_count >= promo.usage_limit) {
            return null;
        }

        return promo;
    }

    /**
     * Yangi foydalanuvchiga promo obunasi yaratish
     */
    static async grantUserSubscription(userId, promo) {
        if (!promo.tarifId) return false;

        const baseTarif = promo.tarifId;

        // Dublikatni oldini olish - shu turdagi obuna borligini tekshirish
        const existingSub = await Subscription.findOne({
            userId,
            tarifId: baseTarif._id,
            active: true
        });

        if (existingSub) {
            return false; // Allqachon mavjud
        }

        await Subscription.create({
            userId,
            tarifId: baseTarif._id,
            type: baseTarif.type,
            tests_count: baseTarif.tests_count,
            active: true
        });

        return true;
    }

    /**
     * Influencerga bonus berish
     */
    static async grantInfluencerReward(influencerId, rewardTarif) {
        if (!rewardTarif || rewardTarif.type !== 'package') {
            return { success: false, message: 'Only package rewards supported' };
        }

        // Mavjud aktiv obunani qidirish
        let influencerSub = await Subscription.findOne({
            userId: influencerId,
            tarifId: rewardTarif._id,
            active: true
        });

        if (influencerSub) {
            // Mavjud obunaga testlar qo'shish
            influencerSub.tests_count += rewardTarif.tests_count;
            await influencerSub.save();
            return { success: true, action: 'added', count: rewardTarif.tests_count };
        } else {
            // Yangi obuna yaratish
            await Subscription.create({
                userId: influencerId,
                tarifId: rewardTarif._id,
                type: rewardTarif.type,
                tests_count: rewardTarif.tests_count,
                active: true,
            });
            return { success: true, action: 'created', count: rewardTarif.tests_count };
        }
    }

    /**
     * Promokodni qayta ishlash
     */
    static async processPromo(promo, newUserId) {
        const result = {
            userGranted: false,
            influencerRewarded: false,
            rewardDetails: null
        };

        // 1. Yangi foydalanuvchiga obuna berish
        result.userGranted = await this.grantUserSubscription(newUserId, promo);

        // 2. Influencer hisobini yangilash
        promo.used_count += 1;

        // Bonus vaqti kelganda
        if (promo.used_count % promo.required_referrals === 0) {
            const rewardResult = await this.grantInfluencerReward(
                promo.ownerId,
                promo.rewardTarifId
            );
            result.influencerRewarded = rewardResult.success;
            result.rewardDetails = rewardResult;
        }

        // Promoni saqlash
        await promo.save();

        return result;
    }
}

/**
 * Foydalanuvchi ro'yxatdan o'tkazish
 */
export async function register(email, password, promoCode = null) {
    try {
        // Input validatsiya
        if (!email || !password) {
            throw new Error("Email va password talab qilinadi");
        }

        // Email allaqachon mavjudligini tekshirish
        const existingUser = await User.findOne({email});
        if (existingUser) {
            // Agar user tasdiqlanmagan bo'lsa, qayta OTP yuborish
            if (!existingUser.isVerified) {
                const otp = generateOTP();
                const otpExpires = getOTPExpiration();

                await User.findByIdAndUpdate(existingUser._id, {
                    otp,
                    otpExpires
                });

                // OTP yuborish
                await sendOTPEmail(email, otp);

                return {
                    message: "Email tasdiqlash kodi yuborildi",
                    email,
                    requiresVerification: true
                };
            }

            return {
                error: {
                    code: ERROR_TYPE.EXIST_USER,
                    message: "User already exists"
                }
            };
        }

        // Parol xashlash
        const passwordHash = await bcrypt.hash(password, 10);

        // OTP generatsiya qilish
        const otp = generateOTP();
        const otpExpires = getOTPExpiration();

        // Foydalanuvchi yaratish (isVerified: false)
        const user = await User.create({
            email,
            passwordHash,
            otp,
            otpExpires,
            isVerified: false
        });

        // OTP yuborish
        await sendOTPEmail(email, otp);

        return {
            message: "Ro'yxatdan o'tdingiz! Emailingizga tasdiqlash kodi yuborildi.",
            email,
            requiresVerification: true
        };

    } catch (error) {
        if (error.code === 11000) {
            return {
                error: {
                    code: ERROR_TYPE.EXIST_USER,
                    message: "User already exists"
                }
            };
        }
        throw error;
    }
}

/**
 * Email tasdiqlash (OTP verify)
 */
export async function verifyOTP(email, otp, promoCode = null) {
    try {
        // Input validatsiya
        if (!email || !otp) {
            throw new Error("Email va OTP talab qilinadi");
        }

        // Foydalanuvchini topish
        const user = await User.findOne({email});
        if (!user) {
            throw new Error("User not found");
        }

        // OTP tekshirish
        if (user.otp !== otp) {
            throw new Error("Noto'g'ri tasdiqlash kodi");
        }

        // OTP muddati tekshirish
        if (isOTPExpired(user.otpExpires)) {
            throw new Error("Tasdiqlash kodi muddati tugagan");
        }

        // Userni tasdiqlash
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        // Endi FREE obuna berish
        let freeTarif = await Tarif.findOne({degree: "free", active: true});

        if (!freeTarif) {
            // Free tarif yo'q qo'lsa, yaratamiz
            freeTarif = await Tarif.create({
                name: "Free",
                type: "package",
                degree: "free",
                description: "Bepul tarif - oddiy testlar",
                tests_count: 5,
                price: 0,
                duration_days: null,
                active: true
            });
        }

        // Default free obunani yaratish
        await Subscription.create({
            userId: user._id,
            tarifId: freeTarif._id,
            type: freeTarif.type,
            tests_count: freeTarif.tests_count,
            active: true
        });

        // Promokodni qayta ishlash
        let promoResult = null;
        let upgradedToPaid = false;

        if (promoCode) {
            const promo = await PromoService.validatePromo(promoCode);

            if (promo) {
                promoResult = await PromoService.processPromo(promo, user._id);
                if (promoResult.userGranted) {
                    upgradedToPaid = true;
                    await Subscription.findOneAndUpdate(
                        {userId: user._id, tarifId: freeTarif._id},
                        {active: false}
                    );
                }
            }
        }

        const access_token = createAccessToken(user);

        const {role} = user.toJSON();
        return {
            message: "Email muvaffaqiyatli tasdiqlandi!",
            email,
            role,
            access_token,
            promoApplied: promoResult?.userGranted || false,
            hasFreeSubscription: !upgradedToPaid
        };

    } catch (error) {
        throw error;
    }
}

/**
 * OTP qayta yuborish
 */
export async function resendOTP(email) {
    try {
        if (!email) {
            throw new Error("Email talab qilinadi");
        }

        const user = await User.findOne({email});
        if (!user) {
            throw new Error("User not found");
        }

        if (user.isVerified) {
            throw new Error("Email allaqachon tasdiqlangan");
        }

        // Yangi OTP generatsiya qilish
        const otp = generateOTP();
        const otpExpires = getOTPExpiration();

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // OTP yuborish
        await sendOTPEmail(email, otp);

        return {
            message: "Tasdiqlash kodi qayta yuborildi",
            email
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Foydalanuvchi tizimga kirish
 */
export async function login(email, password) {
    // Input validatsiya
    if (!email || !password) {
        throw new Error("Email va password talab qilinadi");
    }

    const user = await User.findOne({email});
    if (!user) throw new Error("User not found");

    // Email tasdiqlanganligini tekshirish
    if (!user.isVerified) {
        throw new Error("Email tasdiqlanmagan. Iltimos, emailingizga yuborilgan kodni tasdiqlang.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid password");

    // Tokenlarni yaratish
    const access_token = createAccessToken(user);
    const refresh_token = createRefreshToken(user);

    return {
        access_token,
        refresh_token,
        email: user.email,
        role: user.role,
    };
}

/**
 * Token yangilash
 */
export async function refresh(userId, refreshToken) {
    // Input validatsiya
    if (!userId || !refreshToken) {
        throw new Error("UserId va refreshToken talab qilinadi");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Yangi access token yaratish
    const accessToken = jwt.sign(
        {id: user._id, role: user.role},
        ACCESS_SECRET,
        {expiresIn: "1d"}
    );

    return {accessToken};
}

/**
 * Foydalanuvchi qurilmalari ro'yxati ( zahira )
 */
export async function getDevices({email}) {
    if (!email) {
        throw new Error("Email talab qilinadi");
    }

    const user = await User.findOne({email});
    if (!user) throw new Error("User not found");

    // Hozircha devices maydoni ishlatilmayapti
    return {devices: []};
}

/**
 * Qurilmani o'chirish ( zahira )
 */
export async function deleteDevices({deviceId, email}) {
    if (!email) {
        throw new Error("Email talab qilinadi");
    }

    const user = await User.findOneAndUpdate(
        {email},
        {$pull: {devices: {deviceId}}},
        {new: true}
    );

    if (!user) throw new Error("User not found");

    return {success: true};
}