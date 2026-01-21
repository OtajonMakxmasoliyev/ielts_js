import {Router} from "express";
import {register, login, refresh, deleteDevices, getDevices, verifyOTP, resendOTP} from "../../services/auth.js";
import {authMiddleware} from "../../middleware/auth.js";
import User from "../../models/User.js";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               promoCode:
 *                 type: string
 *                 example: "PROMO_KOD"
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 access_token:
 *                   type: string
 *       400:
 *         description: Registration error
 */
router.post("/register", async (req, res) => {
    const {email, password, promoCode} = req.body;
    // console.log(req.body)
    try {
        const user = await register(email, password, promoCode);
        if(user.error){
            res.status(400).json({error: user.error});
            return
        }
        res.json(user);
    } catch (e) {
        res.status(400).json({error: (e).message});
    }
});


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Access and refresh tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", async (req, res) => {
    let {email, password} = req.body;
    try {

        const response = await login(email, password);
        res.json(response);


    } catch (e) {
        res.status(400).json({error: (e).message});
    }
});


/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - refreshToken
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "6914a6e5ff8f45bd5b2e7206"
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", async (req, res) => {
    const {userId, refreshToken} = req.body;
    try {
        const tokens = await refresh(userId, refreshToken);
        res.json(tokens);
    } catch (e) {
        res.status(401).json({error: (e).message});
    }
});

// /**
//  * @swagger
//  * /auth/devices:
//  *   post:
//  *     summary: Get all user devices
//  *     tags: [Auth]
//  *     security: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 example: "user@example.com"
//  *     responses:
//  *       200:
//  *         description: List of user devices
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 devices:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       _id:
//  *                         type: string
//  *                       deviceId:
//  *                         type: string
//  *                       token:
//  *                         type: string
//  *                       lastUsed:
//  *                         type: string
//  *                         format: date-time
//  *       404:
//  *         description: User not found
//  */
// router.post("/devices", async (req, res) => {
//     const { email } = req.body;
//     try {
//         const result = await getDevices({ email });
//         res.json(result);
//     } catch (e) {
//         res.status(404).json({ error: (e).message });
//     }
// });


//
// /**
//  * @swagger
//  * /auth/delete-device:
//  *   post:
//  *     summary: Delete a specific device for the user
//  *     tags: [Auth]
//  *     security: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *               - deviceId
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 example: "user@example.com"
//  *               deviceId:
//  *                 type: string
//  *                 example: "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
//  *     responses:
//  *       200:
//  *         description: Device deleted successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *       404:
//  *         description: User not found
//  */
// router.post("/delete-device", async (req, res) => {
//     const { email, deviceId } = req.body;
//     try {
//         const result = await deleteDevices({ email, deviceId }); // sen yozgan service funksiya
//         res.json(result);
//     } catch (e) {
//         res.status(404).json({ error: (e).message });
//     }
// });


/**
 * @swagger
 * /auth/get-current-user:
 *   post:
 *     summary: Get current user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 active:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post("/get-current-user", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-passwordHash -devices -answers");

        if (!user) {
            return res.status(404).json({error: "Foydalanuvchi topilmadi"});
        }

        res.json(user);
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Email tasdiqlash (OTP)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               promoCode:
 *                 type: string
 *                 example: "PROMO_KOD"
 *     responses:
 *       200:
 *         description: Email tasdiqlandi
 *       400:
 *         description: Noto'g'ri OTP
 */
router.post("/verify", async (req, res) => {
    const {email, otp, promoCode} = req.body;
    try {
        const result = await verifyOTP(email, otp, promoCode);
        res.json(result);
    } catch (e) {
        res.status(400).json({error: e.message});
    }
});

/**
 * @swagger
 * /auth/resend:
 *   post:
 *     summary: OTP qayta yuborish
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP qayta yuborildi
 *       400:
 *         description: Xatolik
 */
router.post("/resend", async (req, res) => {
    const {email} = req.body;
    try {
        const result = await resendOTP(email);
        res.json(result);
    } catch (e) {
        res.status(400).json({error: e.message});
    }
});

/**
 * @swagger
 * /auth/update-password:
 *   post:
 *     summary: Parolni yangilash
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Joriy parol
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 description: Yangi parol (kamida 6 ta belgi)
 *                 example: "newPassword123"
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Parol muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parol muvaffaqiyatli yangilandi"
 *       400:
 *         description: Noto'g'ri joriy parol
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server xatolik
 */
router.post("/update-password", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const {currentPassword, newPassword} = req.body;

        // Validatsiya
        if (!currentPassword || !newPassword) {
            return res.status(400).json({error: "Joriy va yangi parol kiritilishi shart"});
        }

        if (newPassword.length < 6) {
            return res.status(400).json({error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"});
        }

        // Foydalanuvchini topish
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "Foydalanuvchi topilmadi"});
        }

        // Joriy parolni tekshirish
        const bcrypt = (await import("bcryptjs")).default;
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(400).json({error: "Joriy parol noto'g'ri"});
        }

        // Yangi parolni hash qilish
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Parolni yangilash
        user.passwordHash = newPasswordHash;
        await user.save();

        res.json({
            message: "Parol muvaffaqiyatli yangilandi"
        });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

export default router;
