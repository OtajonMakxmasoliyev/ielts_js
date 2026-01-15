import {Router} from "express";
import Promo from "../../models/Promo.js";
import {authMiddleware} from "../../middleware/auth.js";
import Tarif from "../../models/Tarif.js";
import {validatePromoData, isValidObjectId} from "../../utils/validators.js";
import User from "../../models/User.js";

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
 *                            usage_limit:
 *                                type: number
 *                                example: 100
 *                            expire_date:
 *                                type: string
 *                                format: date-time
 *                                example: "2026-12-31T23:59:59.000Z"
 *        responses:
 *            201:
 *                description: Promo created successfully
 *            400:
 *                description: Validation error
 */
router.post("/create", async (req, res) => {
    try {
        const {code, tarifId, usage_limit, expire_date, rewardTarifId, ownerId, required_referrals} = req.body;

        // Validatsiya
        const validation = validatePromoData({code, tarifId, ownerId, rewardTarifId, expire_date, required_referrals, usage_limit});
        if (!validation.valid) {
            return res.status(400).json({error: validation.errors.join(", ")});
        }

        // Reward tarifni tekshirish
        const rewardTarif = await Tarif.findById(rewardTarifId);
        if (!rewardTarif) {
            return res.status(404).json({error: "Reward tarif topilmadi"});
        }

        if (rewardTarif.type !== "package") {
            return res.status(400).json({error: "Faqat paket tariflari uchun promokod yaratish mumkin"});
        }

        // Base tarifni tekshirish
        const baseTarif = await Tarif.findById(tarifId);
        if (!baseTarif) {
            return res.status(404).json({error: "Base tarif topilmadi"});
        }

        // Influencer (owner) mavjudligini tekshirish
        const owner = await User.findById(ownerId);
        if (!owner) {
            return res.status(404).json({error: "Influencer (owner) topilmadi"});
        }

        // Dublikatni tekshirish
        const existingPromo = await Promo.findOne({code: code.trim().toUpperCase()});
        if (existingPromo) {
            return res.status(400).json({error: "Bu promokod allaqachon mavjud"});
        }

        const newPromo = await Promo.create({
            code: code.trim().toUpperCase(),
            tarifId,
            ownerId,
            usage_limit: usage_limit || 100,
            expire_date: new Date(expire_date),
            rewardTarifId,
            required_referrals: required_referrals || 3
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
        const promos = await Promo.find()
            .populate("tarifId")
            .populate("rewardTarifId")
            .populate("ownerId", "email role")
            .sort({createdAt: -1});
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /promo/stats:
 *    post:
 *        summary: Promokod statistikasini olish
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
 *                        properties:
 *                            code:
 *                                type: string
 *                                example: "INFLUENCER_TOP"
 *        responses:
 *            200:
 *                description: Promokod statistikasi
 */
router.post("/stats", async (req, res) => {
    try {
        const {code} = req.body;

        if (!code) {
            return res.status(400).json({error: "Promokod talab qilinadi"});
        }

        const promo = await Promo.findOne({code: code.toUpperCase()})
            .populate("tarifId")
            .populate("rewardTarifId")
            .populate("ownerId", "email role");

        if (!promo) {
            return res.status(404).json({error: "Promokod topilmadi"});
        }

        // Statistika hisoblash
        const remaining = promo.usage_limit - promo.used_count;
        const progressToNextReward = promo.required_referrals - (promo.used_count % promo.required_referrals);
        const totalRewardsEarned = Math.floor(promo.used_count / promo.required_referrals);

        res.status(200).json({
            promo,
            stats: {
                used_count: promo.used_count,
                remaining: remaining < 0 ? 0 : remaining,
                usage_limit: promo.usage_limit,
                progress_to_next_reward: progressToNextReward,
                total_rewards_earned: totalRewardsEarned,
                is_active: promo.active && new Date() < promo.expire_date && remaining > 0,
                expired: new Date() > promo.expire_date
            }
        });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /promo/deactivate:
 *    post:
 *        summary: Promokodni o'chirish
 *        tags:
 *            - Promo
 *        requestBody:
 *            required: true
 *            content:
 *                application/json:
 *                    schema:
 *                        type: object
 *                        required:
 *                            - id
 *                        properties:
 *                            id:
 *                                type: string
 *        responses:
 *            200:
 *                description: Promokod o'chirildi
 */
router.post("/deactivate", async (req, res) => {
    try {
        const {id} = req.body;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({error: "Noto'g'ri ID"});
        }

        const promo = await Promo.findByIdAndUpdate(
            id,
            {active: false},
            {new: true}
        );

        if (!promo) {
            return res.status(404).json({error: "Promokod topilmadi"});
        }

        res.status(200).json({
            message: "Promokod o'chirildi",
            promo
        });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

export default router;
