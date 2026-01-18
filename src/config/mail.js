/**
 * Email yuborish konfiguratsiyasi
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Email transporter yaratish
// Test uchun Ethereal (renderda ishlamaydi, faqat local)
// Production uchun Brevo/Resend/SendGrid dan foydalaning
export const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS,
    }, // Timeout vaqtini oshirish
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
        // Render sababli TLS certificate ignore qilish
        rejectUnauthorized: false
    }
});

/**
 * OTP email yuborish funksiyasi
 */
export async function sendOTPEmail(email, otp) {
    // DEV MODE: Email yuborish o'chirilgan, OTP kodni log qilish
    console.log("════════════════════════════════════════════════════════════");
    console.log(`📧 EMAIL OTP CODE: ${otp}`);
    console.log(`📧 To: ${email}`);
    console.log("════════════════════════════════════════════════════════════");

    // Agar EMAIL_HOST bo'sh bo'lsa, faqat log qilish
    if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST === "smtp.gmail.com") {
        console.warn("⚠️  SMTP xizmati sozlanmagan. Email yuborilmaydi.");
        return {success: true, devMode: true}; // Dev mode: muvaffaqiyatli deb hisoblaymiz
    }

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || "IELTS Platform"}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "IELTS Platform - Tasdiqlash kodi",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-code { font-size: 36px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 IELTS Platform</h1>
                        <p>Email tasdiqlash</p>
                    </div>
                    <div class="content">
                        <h2>Salom!</h2>
                        <p>Siz tizimga ro'yxatdan o'tmoqchisiz. Hisobingizni tasdiqlash uchun quyidagi kodni kiriting:</p>

                        <div class="otp-code">${otp}</div>

                        <p><strong>Muhim:</strong></p>
                        <ul>
                            <li>Bu kod <strong>5 daqiqa</strong> davomida amal qiladi</li>
                            <li>Kodni hech kimga bermang</li>
                            <li>Agar ro'yxatdan o'tmagan bo'lsangiz, bu xabarni e'tiborsiz qolding</li>
                        </ul>

                        <div class="warning">
                            ⚠️ Agar bu so'rov sizdan bo'lmasa, iltimos, bu xabarni o'chiring.
                        </div>

                        <p>Hurmat bilan,<br>IELTS Platform jamoasi</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} IELTS Platform. Barcha huquqlar himoyalangan.</p>
                        <p>Ushbu xatni avtomatik yuborildi, javob bermang.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email yuborildi: ${email}`);
        return {success: true};
    } catch (error) {
        console.error("❌ Email yuborishda xatolik:", error.message);
        // Error bo'lsa ham, dev mode'da muvaffaqiyatli deb hisoblaymiz
        if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST === "smtp.gmail.com") {
            return {success: true, devMode: true, error: error.message};
        }
        return {success: false, error: error.message};
    }
}

/**
 * Login OTP email yuborish
 */
export async function sendLoginOTPEmail(email, otp) {
    // DEV MODE: Email yuborish o'chirilgan, OTP kodni log qilish
    console.log("════════════════════════════════════════════════════════════");
    console.log(`🔐 LOGIN OTP CODE: ${otp}`);
    console.log(`🔐 To: ${email}`);
    console.log("════════════════════════════════════════════════════════════");

    // Agar EMAIL_HOST bo'sh bo'lsa, faqat log qilish
    if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST === "smtp.gmail.com") {
        console.warn("⚠️  SMTP xizmati sozlanmagan. Email yuborilmaydi.");
        return {success: true, devMode: true}; // Dev mode: muvaffaqiyatli deb hisoblaymiz
    }

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || "IELTS Platform"}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "IELTS Platform - Login kodi",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-code { font-size: 36px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 IELTS Platform</h1>
                        <p>Login tasdiqlash</p>
                    </div>
                    <div class="content">
                        <h2>Salom!</h2>
                        <p>Tizimga kirish uchun tasdiqlash kodi:</p>

                        <div class="otp-code">${otp}</div>

                        <p><strong>Muhim:</strong></p>
                        <ul>
                            <li>Bu kod <strong>5 daqiqa</strong> davomida amal qiladi</li>
                            <li>Kodni hech kimga bermang</li>
                        </ul>

                        <p>Hurmat bilan,<br>IELTS Platform jamoasi</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} IELTS Platform. Barcha huquqlar himoyalangan.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email yuborildi: ${email}`);
        return {success: true};
    } catch (error) {
        console.error("❌ Email yuborishda xatolik:", error.message);
        // Error bo'lsa ham, dev mode'da muvaffaqiyatli deb hisoblaymiz
        if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST === "smtp.gmail.com") {
            return {success: true, devMode: true, error: error.message};
        }
        return {success: false, error: error.message};
    }
}
