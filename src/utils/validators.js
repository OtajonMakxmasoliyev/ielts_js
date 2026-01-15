/**
 * Validatsiya vositalari
 */

/**
 * Email formatini tekshirish
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Promokod formatini tekshirish
 */
export function isValidPromoCode(code) {
    if (!code || typeof code !== 'string') return false;
    const trimmed = code.trim();
    // Kamida 3 ta belgi, faqat harf va raqam
    return /^[A-Za-z0-9_]{3,50}$/.test(trimmed);
}

/**
 * ObjectId formatini tekshirish
 */
export function isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Parol kuchini tekshirish
 */
export function getPasswordStrength(password) {
    if (!password || typeof password !== 'string') {
        return { score: 0, message: "Parol talab qilinadi" };
    }

    if (password.length < 6) {
        return { score: 1, message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const messages = {
        1: "Zaif parol",
        2: "O'rtacha parol",
        3: "Yaxshi parol",
        4: "Kuchli parol"
    };

    return { score, message: messages[score] || "Noma'lum" };
}

/**
 * Promokod ma'lumotlarini validatsiya qilish
 */
export function validatePromoData(data) {
    const errors = [];

    if (!data.code || !isValidPromoCode(data.code)) {
        errors.push("Promokod 3-50 ta belgidan iborat bo'lishi kerak");
    }

    if (!data.tarifId || !isValidObjectId(data.tarifId)) {
        errors.push("Tarif ID noto'g'ri");
    }

    if (!data.ownerId || !isValidObjectId(data.ownerId)) {
        errors.push("Owner ID noto'g'ri");
    }

    if (!data.rewardTarifId || !isValidObjectId(data.rewardTarifId)) {
        errors.push("Reward Tarif ID noto'g'ri");
    }

    if (!data.expire_date) {
        errors.push("Tugash sanasi talab qilinadi");
    } else {
        const expireDate = new Date(data.expire_date);
        if (isNaN(expireDate.getTime()) || expireDate <= new Date()) {
            errors.push("Tugash sanasi kelajakda bo'lishi kerak");
        }
    }

    if (data.required_referrals !== undefined) {
        const refs = parseInt(data.required_referrals);
        if (isNaN(refs) || refs < 1 || refs > 100) {
            errors.push("Required referrals 1-100 orasida bo'lishi kerak");
        }
    }

    if (data.usage_limit !== undefined) {
        const limit = parseInt(data.usage_limit);
        if (isNaN(limit) || limit < 1) {
            errors.push("Usage limit kamida 1 bo'lishi kerak");
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
