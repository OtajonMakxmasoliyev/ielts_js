/**
 * Email yuborish konfiguratsiyasi
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Email transporter yaratish
export const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 465,
    secure: process.env.EMAIL_SECURE !== "false", // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * OTP email yuborish funksiyasi
 */
export async function sendOTPEmail(email, otp) {
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
        return { success: true };
    } catch (error) {
        console.error("Email yuborishda xatolik:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Login OTP email yuborish
 */
export async function sendLoginOTPEmail(email, otp) {
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
        return { success: true };
    } catch (error) {
        console.error("Email yuborishda xatolik:", error);
        return { success: false, error: error.message };
    }
}
