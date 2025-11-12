import { Router } from "express";
import { register, login, refresh, deleteDevices, getDevices } from "../../services/auth.js";


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
 *               - deviceId
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               deviceId:
 *                 type: string
 *                 example: "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
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
    const { email, password, deviceId } = req.body;
    try {
        const user = await register(email, password, deviceId);
        res.json(user);
    } catch (e) {
        res.status(400).json({ error: (e).message });
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
 *               - deviceId
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               deviceId:
 *                 type: string
 *                 example: "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
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
    let { email, password, deviceId } = req.body;
    try {

        const response = await login(email, password, deviceId);
        res.json(response);



    } catch (e) {
        res.status(400).json({ error: (e).message });
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
 *               - deviceId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "6914a6e5ff8f45bd5b2e7206"
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               deviceId:
 *                 type: string
 *                 example: "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
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
    const { userId, refreshToken, deviceId } = req.body;
    try {
        const tokens = await refresh(userId, refreshToken, deviceId);
        res.json(tokens);
    } catch (e) {
        res.status(401).json({ error: (e).message });
    }
});

/**
 * @swagger
 * /auth/devices:
 *   post:
 *     summary: Get all user devices
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
 *         description: List of user devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       deviceId:
 *                         type: string
 *                       token:
 *                         type: string
 *                       lastUsed:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: User not found
 */
router.post("/devices", async (req, res) => {
    const { email } = req.body;
    try {
        const result = await getDevices({ email });
        res.json(result);
    } catch (e) {
        res.status(404).json({ error: (e).message });
    }
});





/**
 * @swagger
 * /auth/delete-device:
 *   post:
 *     summary: Delete a specific device for the user
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
 *               - deviceId
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               deviceId:
 *                 type: string
 *                 example: "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: User not found
 */
router.post("/delete-device", async (req, res) => {
    const { email, deviceId } = req.body;
    try {
        const result = await deleteDevices({ email, deviceId }); // sen yozgan service funksiya
        res.json(result);
    } catch (e) {
        res.status(404).json({ error: (e).message });
    }
});



export default router;
