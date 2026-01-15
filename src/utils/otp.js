/**
 * OTP (One-Time Password) utility functions
 */

/**
 * 6 xonali OTP generatsiya qilish
 */
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * OTP muddatini belgilash (5 daqiqa)
 */
export function getOTPExpiration(minutes = 5) {
    return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * OTP tugaganligini tekshirish
 */
export function isOTPExpired(expirationDate) {
    return new Date() > expirationDate;
}
