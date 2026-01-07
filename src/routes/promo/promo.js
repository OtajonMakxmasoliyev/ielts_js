import {Router} from "express";
import Promo from "../../models/Promo.js";
import {authMiddleware} from "../../middleware/auth.js";
import Tarif from "../../models/Tarif.js";

const router = Router();

/**
 * @swagger
 * tags:
 *    - name: Promo
 *      description: Promokodlarni boshqarish (Adminlar uchun)
 */

/**
 * @swagger
 * /promo/create:
 *    post:
 *        summary: Influencer uchun mukofot paketi bilan birga promokod yaratish
 *        tags:
 *            - Promo
 *        requestBody:
 *            required: true
 *            content:
 *                application/json:
 *                    schema:
 *                        type: object
 *                        required:
 *                            - code
 *                            - tarifId
 *                            - ownerId
 *                            - rewardTarifId
 *                            - expire_date
 *                        properties:
 *                            code:
 *                                type: string
 *                                example: "INFLUENCER_TOP"
 *                            tarifId:
 *                                type: string
 *                                description: "Yangi kelgan foydalanuvchi oladigan paket ID"
 *                                example: "65fa12ab34cd..."
 *                            ownerId:
 *                                type: string
 *                                description: "Influencer (User) ID"
 *                                example: "65fb98de12aa..."
 *                            rewardTarifId:
 *                                type: string
 *                                description: "Influencerga bonus sifatida beriladigan paket ID"
 *                                example: "6600ab7789ff..."
 *                            required_referrals:
 *                                type: number
 *                                example: 5
 *                            expire_date:
 *                                type: string
 *                                format: date-time
 *                                example: "2026-12-31T23:59:59.000Z"
 *        responses:
 *            201:
 *                description: Promo created successfully
 */


router.post("/create", async (req, res) => {
    try {
        const {code, tarifId, usage_limit, expire_date, rewardTarifId, ownerId} = req.body;
        const rewardTarif = await Tarif.findById(rewardTarifId);

        if (rewardTarif.type !== "package") {
            res.status(400).json({error: "Faqat paket tariflari uchun promokod yaratish mumkin"});
            return
        }

        const newPromo = await Promo.create({
            code: code.toUpperCase(), // Har doim katta harfda saqlash
            tarifId, ownerId, usage_limit: usage_limit || 100, expire_date, rewardTarifId
        });

        res.status(201).json(newPromo);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

/**
 * @swagger
 * /promo/list:
 *    post:
 *        summary: Barcha promokodlar ro'yxatini olish
 *        tags:
 *            - Promo
 *        security:
 *            - bearerAuth: []
 *        responses:
 *            200:
 *                description: Promokodlar ro'yxati
 *            500:
 *                description: Server xatoligi
 */
router.post("/list", async (req, res) => {
    try {
        const promos = await Promo.find().populate("tarifId rewardTarifId");
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

export default router;
