import { Router } from "express";
import { register, login, refresh, deleteDevices, getDevices } from "../../services/auth.js";


const router = Router();

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access and refresh tokens
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of user devices
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device deleted successfully, returns remaining devices
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
