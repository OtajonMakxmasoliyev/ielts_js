import express from "express";
import Question from "../../models/Question.js"; // IQuestion dan model ochib qo'yilgan deb olamiz
import {checkAnswers} from "../../services/questions.js";
import User from "../../models/User.js";
import Part from "../../models/Part.js";
import Subscription from "../../models/Subscription.js";
import {authMiddleware} from "../../middleware/auth.js";


const router = express.Router();

/**
 * @swagger
 * /questions/create-listening:
 *   post:
 *     summary: Create a new listening test
 *     description: IELTS Listening test yaratish (4 ta Part bilan)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - parts
 *             properties:
 *               title:
 *                 type: string
 *                 example: "IELTS Listening Test 1"
 *               type:
 *                 type: string
 *                 example: "listening"
 *               parts:
 *                 type: array
 *                 minItems: 4
 *                 maxItems: 4
 *                 items:
 *                   type: object
 *                   properties:
 *                     markdown:
 *                       type: string
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     part_type:
 *                       type: array
 *                       items:
 *                         type: string
 *                     audio:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         key:
 *                           type: string
 *                         duration:
 *                           type: number
 *                         format:
 *                           type: string
 *                         size:
 *                           type: number
 *                     transcript:
 *                       type: string
 *                     audioMetadata:
 *                       type: object
 *     responses:
 *       201:
 *         description: Listening test created successfully
 *       400:
 *         description: Invalid data - 4 ta Part majburiy
 *       401:
 *         description: Unauthorized
 */
router.post("/create-listening", async (req, res) => {
    try {
        const {parts, ...questionData} = req.body;

        // 4 ta Part tekshiruvi
        if (!Array.isArray(parts) || parts.length !== 4) {
            return res.status(400).json({
                error: 'INVALID_PARTS_COUNT',
                message: 'Listening test uchun 4 ta Part majburiy'
            });
        }

        // Har bir Part audio/transcript mavjudligini tekshirish
        for (const part of parts) {
            if (!part.audio || !part.audio.url) {
                return res.status(400).json({
                    error: 'MISSING_AUDIO',
                    message: 'Har bir Part uchun audio fayl majburiy'
                });
            }
        }

        // Type ni listening qilish
        questionData.type = questionData.type || 'listening';

        const question = new Question(questionData);
        await question.save();

        const createdParts = await Part.insertMany(
            parts.map(p => ({...p, collection_id: question._id}))
        );

        question.parts = createdParts.map(p => p._id);
        await question.save();

        res.status(201).json(question);
    } catch (err) {
        res.status(400).json({error: (err).message});
    }
});

/**
 * @swagger
 * /questions/create:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 */
router.post("/create", async (req, res) => {
    try {
        const {parts, ...questionData} = req.body;

        const question = new Question(questionData);
        await question.save();

        // Agar parts yuborilgan bo‘lsa, Part schema bo‘yicha yaratiladi
        if (Array.isArray(parts) && parts.length > 0) {
            const createdParts = await Part.insertMany(parts.map(p => ({...p, collection_id: question._id})) // agar bog‘lash kerak bo‘lsa
            );

            // yangi yaratilgan Part ID larini question.parts ga qo‘shamiz
            question.parts = createdParts.map(p => p._id);
            await question.save();
        }

        res.status(201).json(question);
    } catch (err) {
        res.status(400).json({error: (err).message});
    }
});

/**
 * @swagger
 * /questions/list:
 *   post:
 *     summary: Get all questions with pagination (user's degree based)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 description: Sahifa raqami
 *                 default: 1
 *                 minimum: 1
 *               limit:
 *                 type: integer
 *                 description: Bir sahifadagi testlar soni
 *                 default: 20
 *                 minimum: 1
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: List of questions with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 degree:
 *                   type: string
 *                   enum: [free, premium]
 *                   description: Foydalanuvchi obunasi darajasi
 *                 subscription:
 *                   type: object
 *                   nullable: true
 *                   description: Obuna ma'lumotlari
 *                   properties:
 *                     type:
 *                       type: string
 *                     degree:
 *                       type: string
 *                     remaining_tests:
 *                       type: integer
 *                     tarif_name:
 *                       type: string
 *                 questions:
 *                   type: array
 *                   description: Testlar ro'yxati
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       metadata:
 *                         type: object
 *                       published:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       blocked:
 *                         type: boolean
 *                         description: Premium test, free user uchun bloklangan
 *                 page:
 *                   type: integer
 *                   description: Joriy sahifa
 *                 limit:
 *                   type: integer
 *                   description: Bir sahifadagi elementlar soni
 *                 total:
 *                   type: integer
 *                   description: Umumiy testlar soni
 *                 pages:
 *                   type: integer
 *                   description: Umumiy sahifalar soni
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/list", async (req, res) => {
    try {
        const {page = 1, limit = 20} = req.body;
        const userId = req.user.id;

        // Aktiv obunani topish (premium yoki package)
        let sub = await Subscription.findOne({
            userId,
            active: true,
            finished: {$ne: true}
        }).populate({
            path: "tarifId",
            select: "degree name type tests_count"
        });

        // Agar obuna bo'lmasa, free testlarni qaytaramiz
        let degree = "free";
        let subscriptionInfo = null;

        if (sub && sub.tarifId) {
            degree = sub.tarifId.degree || "free";
            subscriptionInfo = {
                type: sub.type,
                degree: degree,
                remaining_tests: sub.remaining_tests,
                tarif_name: sub.tarifId.name
            };
        }

        // Umumiy soni
        const total = await Question.countDocuments({
            "metadata.degree": {$in: ["free", "premium"]}
        });

        // Aggregation pipeline bilan blocked maydonini qo'shish va pagination
        const questions = await Question.aggregate([
            {
                $match: {
                    "metadata.degree": {$in: ["free", "premium"]}
                }
            },
            {
                $addFields: {
                    blocked: {
                        $cond: [
                            {$and: [
                                {$eq: ["$metadata.degree", "premium"]},
                                {$eq: [degree, "free"]}
                            ]},
                            true,
                            false
                        ]
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    type: 1,
                    tags: 1,
                    metadata: 1,
                    published: 1,
                    createdAt: 1,
                    blocked: 1
                }
            },
            {$sort: {createdAt: -1}},
            {$skip: (page - 1) * limit},
            {$limit: limit}
        ]);

        res.json({
            degree,
            subscription: subscriptionInfo,
            questions,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /questions/get-one:
 *   post:
 *     summary: Get a single question by ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Question details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.post("/get-one", async (req, res) => {
    try {
        const {id} = req.body;
        const question = await Question.findById(id).populate("parts");
        if (!question) return res.status(404).json({error: "Question not found"});
        res.json(question);
    } catch (err) {
        res.status(500).json({error: (err).message});
    }
});

/**
 * @swagger
 * /questions/update:
 *   post:
 *     summary: Update a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.post("/update", async (req, res) => {
    try {
        const {id, ...updates} = req.body;
        const question = await Question.findByIdAndUpdate(id, {...updates, updatedAt: new Date()}, {new: true});
        if (!question) return res.status(404).json({error: "Question not found"});
        res.json(question);
    } catch (err) {
        res.status(400).json({error: (err).message});
    }
});

/**
 * @swagger
 * /questions/delete:
 *   post:
 *     summary: Delete a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.post("/delete", async (req, res) => {
    try {
        const {id} = req.body;
        const question = await Question.findByIdAndDelete(id);
        if (!question) return res.status(404).json({error: "Question not found"});
        res.json({message: "Question deleted successfully"});
    } catch (err) {
        res.status(500).json({error: (err).message});
    }
});


/**
 * @swagger
 * /questions/check-answers:
 *   post:
 *     summary: Check user's answers for a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - answers
 *             properties:
 *               questionId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["A", "B", "C"]
 *     responses:
 *       200:
 *         description: Answers checked successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.post("/check-answers", authMiddleware, async (req, res) => {
    try {
        const {questionId, answers} = req.body;
        const userId = req.user.id;

        let subscription = await Subscription.findOne({
            userId, active: true, type: "premium"
        }).populate("tarifId");

        if (!subscription || subscription.finished) {
            if (subscription?.finished) {
                subscription.active = false;
                await subscription.save();
            }
            subscription = await Subscription.findOne({
                userId, active: true, type: "package"
            }).populate("tarifId");
        }

        if (!subscription || subscription.finished) {
            if (subscription?.finished) {
                subscription.active = false;
                await subscription.save();
            }
            return res.status(403).json({
                error: "NO_ACTIVE_SUBSCRIPTION", message: "Sizda aktiv tarif mavjud emas yoki limiti tugagan."
            });
        }

        const result = await checkAnswers({questionId, answers});
        if (result.err) return res.status(400).json(result);

        const user = await User.findById(userId);
        user.answers.push(result);
        await user.save();

        subscription.used.push({
            testId: questionId, score: result.score, used_time: new Date()
        });
        await subscription.save();

        res.json({
            ...result, subscription_info: {
                type: subscription.type, remaining_tests: subscription.remaining_tests, // Virtual field ishlaydi
                used_total: subscription.used.length, expires_at: subscription.expired_date
            }
        });

    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

export default router;
