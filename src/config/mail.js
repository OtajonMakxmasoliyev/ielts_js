/**
 * Email yuborish konfiguratsiyasi - Nodemailer
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Transport yaratish
let transporter = null;

// Development mode: Ethereal email (test uchun)
// Production mode: Haqiqiy SMTP konfiguratsiyasi
async function createTransporter() {
    if (transporter) {
        return transporter;
    }

    // Agar EMAIL_HOST sozlangan bo'lsa, haqiqiy SMTP ishlatamiz
    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST !== 'smtp.ethereal.email') {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        console.log(`📧 Email transporter configured: ${process.env.EMAIL_HOST}`);
    } else {
        // Development mode uchun Ethereal test account
        try {
            const user = process.env.EMAIL_USER;
            const pass = process.env.EMAIL_PASS;
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log(`📧 Development mode: Ethereal email configured`);
            console.log(`   Preview URL: https://ethereal.email/messages`);
        } catch (error) {
            console.warn("⚠️  Could not create Ethereal account, email will be logged only");
        }
    }

    return transporter;
}

/**
 * OTP email yuborish funksiyasi
 */
export async function sendOTPEmail(email, otp) {
    // OTP kodni log qilish
    console.log("════════════════════════════════════════════════════════════");
    console.log(`📧 EMAIL OTP CODE: ${otp}`);
    console.log(`📧 To: ${email}`);
    console.log("════════════════════════════════════════════════════════════");

    // Agar email konfiguratsiyasi bo'lmasa
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_USER) {
        console.warn("⚠️  Email konfiguratsiyasi sozlanmagan. Email yuborilmaydi.");
        return {success: true, devMode: true};
    }

    try {
        const transport = await createTransporter();

        if (!transport) {
            console.warn("⚠️  Email transporter yaratilmadi. Email yuborilmaydi.");
            return {success: true, devMode: true};
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"IELTS Platform" <${process.env.EMAIL_USER}>`,
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

        const info = await transport.sendMail(mailOptions);

        console.log(`✅ Email yuborildi: ${email}`);
        console.log(`   Message ID: ${info.messageId}`);

        // Ethereal uchun preview URL
        if (process.env.NODE_ENV !== 'production' && info.getTestMessageUrl) {
            console.log(`   Preview URL: ${info.getTestMessageUrl(info)}`);
        }

        return {success: true, messageId: info.messageId};
    } catch (error) {
        console.error("❌ Email yuborishda xatolik:", error.message);
        // Error bo'lsa ham, log qilingan OTP bilan davom etamiz
        return {success: true, devMode: true, error: error.message};
    }
}

/**
 * Login OTP email yuborish
 */
export async function sendLoginOTPEmail(email, otp) {
    // OTP kodni log qilish
    console.log("════════════════════════════════════════════════════════════");
    console.log(`🔐 LOGIN OTP CODE: ${otp}`);
    console.log(`🔐 To: ${email}`);
    console.log("════════════════════════════════════════════════════════════");

    // Agar email konfiguratsiyasi bo'lmasa
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_USER) {
        console.warn("⚠️  Email konfiguratsiyasi sozlanmagan. Email yuborilmaydi.");
        return {success: true, devMode: true};
    }

    try {
        const transport = await createTransporter();

        if (!transport) {
            console.warn("⚠️  Email transporter yaratilmadi. Email yuborilmaydi.");
            return {success: true, devMode: true};
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"IELTS Platform" <${process.env.EMAIL_USER}>`,
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

        const info = await transport.sendMail(mailOptions);

        console.log(`✅ Email yuborildi: ${email}`);
        console.log(`   Message ID: ${info.messageId}`);

        // Ethereal uchun preview URL
        if (process.env.NODE_ENV !== 'production' && info.getTestMessageUrl) {
            console.log(`   Preview URL: ${info.getTestMessageUrl(info)}`);
        }

        return {success: true, messageId: info.messageId};
    } catch (error) {
        console.error("❌ Email yuborishda xatolik:", error.message);
        // Error bo'lsa ham, log qilingan OTP bilan davom etamiz
        return {success: true, devMode: true, error: error.message};
    }
}

/**
 * Transporterni yopish ( graceful shutdown uchun)
 */
export async function closeTransporter() {
    if (transporter) {
        transporter.close();
        transporter = null;
        console.log("📧 Email transporter closed");
    }
}
