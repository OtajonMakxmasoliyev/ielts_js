import express from "express";
import Question from "../../models/Question.js"; // IQuestion dan model ochib qo'yilgan deb olamiz
import {checkAnswers} from "../../services/questions.js";
import User from "../../models/User.js";
import Part from "../../models/Part.js";
import Subscription from "../../models/Subscription.js";


const router = express.Router();

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
 *     summary: Get all questions
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all questions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/list", async (_req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        res.status(500).json({error: (err).message});
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
router.post("/check-answers", async (req, res) => {
    try {
        const {questionId, answers} = req.body;
        const reqUser = req?.user;

        if (!questionId || !Array.isArray(answers)) {
            return res.status(400).json({error: "questionId and answers are required"});
        }

        // Tarif tekshiruvi
        const subscription = await Subscription.findOne({userId: reqUser.id, active: true})
            .populate("tarifId");

        if (!subscription) {
            return res.status(403).json({
                error: "NO_SUBSCRIPTION",
                message: "Aktiv tarif topilmadi. Iltimos, tarif sotib oling."
            });
        }

        // Muddat tekshirish
        if (subscription.expired_date && new Date() > subscription.expired_date) {
            subscription.active = false;
            await subscription.save();
            return res.status(403).json({
                error: "SUBSCRIPTION_EXPIRED",
                message: "Tarif muddati tugagan"
            });
        }

        // Test limiti tekshirish
        if (subscription.used.length >= subscription.tests_count) {
            return res.status(403).json({
                error: "TEST_LIMIT_REACHED",
                message: `Test limiti tugagan. ${subscription.tests_count} ta testdan ${subscription.used.length} tasi ishlangan.`,
                remaining: 0
            });
        }

        const user = await User.findById(reqUser.id);
        const result = await checkAnswers({questionId, answers});

        if ("err" in result) {
            return res.status(400).json({...result});
        }

        // Natijani user.answers ga saqlash
        user?.answers.push(result);
        await user?.save();

        // Tarifga ishlangan testni qo'shish
        subscription.used.push({
            testId: questionId,
            score: result.score,
            used_time: new Date()
        });
        await subscription.save();

        // Javobga tarif ma'lumotlarini qo'shish
        res.json({
            ...result,
            subscription: {
                tarif: subscription.tarifId,
                tests_count: subscription.tests_count,
                used_count: subscription.used.length,
                remaining_count: subscription.tests_count - subscription.used.length
            }
        });

    } catch (err) {
        if ((err).message === "Question not found") {
            return res.status(404).json({error: "Question not found"});
        }
        res.status(500).json({error: (err).message});
    }
});


export default router;
