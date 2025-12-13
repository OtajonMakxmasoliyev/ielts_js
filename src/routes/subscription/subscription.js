import express from "express";
import Subscription from "../../models/Subscription.js";
import Tarif from "../../models/Tarif.js";

const router = express.Router();

/**
 * @swagger
 * /subscription/buy:
 *   post:
 *     summary: Tarif sotib olish
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tarifId
 *             properties:
 *               tarifId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Tarif muvaffaqiyatli sotib olindi
 *       400:
 *         description: Xato ma'lumot
 *       404:
 *         description: Tarif topilmadi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
router.post("/buy", async (req, res) => {
    try {
        const { tarifId } = req.body;
        const userId = req.user.id;

        if (!tarifId) {
            return res.status(400).json({ error: "tarifId talab qilinadi" });
        }

        // Tarifni tekshirish
        const tarif = await Tarif.findById(tarifId);

        if (!tarif) {
            return res.status(404).json({ error: "Tarif topilmadi" });
        }

        if (!tarif.active) {
            return res.status(400).json({ error: "Bu tarif hozirda mavjud emas" });
        }

        // Muddat hisoblash
        let expired_date = null;
        if (tarif.duration_days) {
            expired_date = new Date();
            expired_date.setDate(expired_date.getDate() + tarif.duration_days);
        }

        // Mavjud aktiv tarifni tekshirish
        let subscription = await Subscription.findOne({ userId, active: true });

        if (subscription && !subscription.finished) {
            // Agar aktiv tarif bo'lsa va hali tugamagan bo'lsa - testlar sonini qo'shish
            subscription.tests_count += tarif.tests_count;
            subscription.tarifId = tarifId;
            if (expired_date) {
                // Agar yangi muddatni qo'shish kerak bo'lsa
                if (subscription.expired_date) {
                    subscription.expired_date = new Date(Math.max(
                        subscription.expired_date.getTime(),
                        expired_date.getTime()
                    ));
                } else {
                    subscription.expired_date = expired_date;
                }
            }
            await subscription.save();

            return res.status(200).json({
                message: "Mavjud tarifga qo'shildi",
                subscription: await subscription.populate("tarifId")
            });
        }

        // Yangi tarif yaratish
        const newSubscription = new Subscription({
            userId,
            tarifId,
            tests_count: tarif.tests_count,
            expired_date,
            used: []
        });

        await newSubscription.save();

        res.status(201).json({
            message: "Tarif muvaffaqiyatli sotib olindi",
            subscription: await newSubscription.populate("tarifId")
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /subscription/my:
 *   post:
 *     summary: Mening tariflarimni ko'rish
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foydalanuvchi tariflari
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
router.post("/my", async (req, res) => {
    try {
        const userId = req.user.id;

        const subscriptions = await Subscription.find({ userId })
            .populate("tarifId")
            .sort({ createdAt: -1 });

        // Aktiv tarifni ajratib ko'rsatish
        const activeSubscription = subscriptions.find(s => s.active && !s.finished);

        res.json({
            active: activeSubscription || null,
            all: subscriptions
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /subscription/check:
 *   post:
 *     summary: Test ishlash imkoniyatini tekshirish
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tarif holati
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
router.post("/check", async (req, res) => {
    try {
        const userId = req.user.id;

        const subscription = await Subscription.findOne({ userId, active: true })
            .populate("tarifId");

        if (!subscription) {
            return res.json({
                canTakeTest: false,
                message: "Aktiv tarif topilmadi. Iltimos, tarif sotib oling.",
                subscription: null
            });
        }

        // Muddat tekshirish
        if (subscription.expired_date && new Date() > subscription.expired_date) {
            subscription.active = false;
            await subscription.save();

            return res.json({
                canTakeTest: false,
                message: "Tarif muddati tugagan",
                subscription
            });
        }

        // Test limiti tekshirish
        if (subscription.finished) {
            return res.json({
                canTakeTest: false,
                message: `Test limiti tugagan. ${subscription.tests_count} ta testdan ${subscription.used.length} tasi ishlangan.`,
                subscription
            });
        }

        res.json({
            canTakeTest: true,
            message: `Test ishlash mumkin. Qolgan: ${subscription.remaining_tests} ta`,
            subscription
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /subscription/history:
 *   post:
 *     summary: Ishlangan testlar tarixi
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Testlar tarixi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
router.post("/history", async (req, res) => {
    try {
        const userId = req.user.id;

        const subscription = await Subscription.findOne({ userId, active: true })
            .populate("tarifId")
            .populate("used.testId", "title type slug");

        if (!subscription) {
            return res.json({
                message: "Aktiv tarif topilmadi",
                history: []
            });
        }

        res.json({
            tarif: subscription.tarifId,
            tests_count: subscription.tests_count,
            used_count: subscription.used.length,
            remaining_count: subscription.remaining_tests,
            history: subscription.used
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;