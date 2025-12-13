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
        const {tarifId} = req.body;
        const userId = req.user.id;

        if (!tarifId) {
            return res.status(400).json({error: "tarifId talab qilinadi"});
        }

        // Tarifni tekshirish
        const tarif = await Tarif.findById(tarifId);

        if (!tarif) {
            return res.status(404).json({error: "Tarif topilmadi"});
        }

        if (!tarif.active) {
            return res.status(400).json({error: "Bu tarif hozirda mavjud emas"});
        }

        // Mavjud aktiv subscriptionlarni tekshirish
        const existingSubscription = await Subscription.findOne({
            userId, active: true,
        });
        // Agar mavjud subscription boshqa tarifga tegishli bo'lsa - uni yopish
        if (existingSubscription) {
            existingSubscription.active = false;
            await existingSubscription.save();
        }
        let existingCount = tarif.tests_count;
        if (tarif.type === "package") {
            // PAKET: testlar soni cheklangan, muddat yo'q
            if (existingSubscription && !existingSubscription.finished) {
                // Mavjud paketga testlar qo'shish
                existingCount += existingSubscription.tests_count - existingSubscription?.used.length || 0;

            }

            // Yangi paket yaratish
            const newSubscription = new Subscription({
                userId, tarifId, type: "package", tests_count: existingCount, expired_date: null, used: []
            });

            await newSubscription.save();

            return res.status(201).json({
                message: "Paket muvaffaqiyatli sotib olindi", subscription: await newSubscription.populate("tarifId")
            });

        } else {
            // PREMIUM: testlar cheksiz, muddat bor
            let expired_date;

            if (existingSubscription && !existingSubscription.finished && existingSubscription.type === "premium") {
                // Mavjud premiumga muddat qo'shish
                const currentExpiry = new Date(existingSubscription.expired_date || new Date());
                expired_date = new Date(currentExpiry);
                expired_date.setDate(expired_date.getDate() + tarif.duration_days);
            } else {
                // Yangi premium - bugundan boshlab
                expired_date = new Date();
                expired_date.setDate(expired_date.getDate() + tarif.duration_days);
            }

            // Yangi premium yaratish
            const newSubscription = new Subscription({
                userId, tarifId, type: "premium", tests_count: null, expired_date, used: []
            });

            await newSubscription.save();

            return res.status(201).json({
                message: "Premium muvaffaqiyatli sotib olindi", subscription: await newSubscription.populate("tarifId")
            });
        }

    } catch (err) {
        res.status(500).json({error: err.message});
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
        const subscription = await Subscription.findOne({
            userId, active: true, finished: {$ne: true}
        });


        res.json(subscription);

    } catch (err) {
        res.status(500).json({error: err.message});
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

        // Avval premium tekshiriladi (ustuvorlik)
        let subscription = await Subscription.findOne({
            userId, type: "premium", active: true
        }).populate("tarifId");

        // Premium topilmasa yoki tugagan bo'lsa, paket tekshiriladi
        if (!subscription || subscription.finished) {
            if (subscription && subscription.finished) {
                subscription.active = false;
                await subscription.save();
            }

            subscription = await Subscription.findOne({
                userId, type: "package", active: true
            }).populate("tarifId");
        }

        if (!subscription) {
            return res.json({
                canTakeTest: false, message: "Aktiv tarif topilmadi. Iltimos, tarif sotib oling.", subscription: null
            });
        }

        // Tugaganligini tekshirish
        if (subscription.finished) {
            subscription.active = false;
            await subscription.save();

            const message = subscription.type === "premium" ? "Premium muddati tugagan" : `Paket limiti tugagan. ${subscription.tests_count} ta testdan ${subscription.used.length} tasi ishlangan.`;

            return res.json({
                canTakeTest: false, message, subscription
            });
        }

        // Test ishlash mumkin
        const message = subscription.type === "premium" ? `Premium aktiv. Muddat: ${subscription.expired_date.toLocaleDateString()}` : `Paket aktiv. Qolgan: ${subscription.remaining_tests} ta test`;

        res.json({
            canTakeTest: true, message, subscription
        });

    } catch (err) {
        res.status(500).json({error: err.message});
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

        // Barcha aktiv subscriptionlar
        const subscriptions = await Subscription.find({userId, active: true})
            .populate("tarifId")
            .populate("used.testId", "title type slug");

        if (subscriptions.length === 0) {
            return res.json({
                message: "Aktiv tarif topilmadi", history: []
            });
        }

        // Barcha ishlangan testlarni birlashtirish
        const allHistory = subscriptions.flatMap(sub => sub.used.map(u => ({
            ...u.toObject(), subscription_type: sub.type, tarif: sub.tarifId
        }))).sort((a, b) => new Date(b.used_time) - new Date(a.used_time));

        res.json({
            subscriptions: subscriptions.map(s => ({
                type: s.type,
                tarif: s.tarifId,
                tests_count: s.tests_count,
                used_count: s.used.length,
                remaining_count: s.remaining_tests,
                expired_date: s.expired_date
            })), history: allHistory
        });

    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

export default router;