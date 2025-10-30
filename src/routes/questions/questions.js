import express from "express";
import Question from "../../models/Question.js"; // IQuestion dan model ochib qo'yilgan deb olamiz
import { checkAnswers } from "../../services/questions.js";
import User from "../../models/User.js";
import Part from "../../models/Part.js";



const router = express.Router();

/**
 * CREATE
 * POST /create
 */
router.post("/create", async (req, res) => {
    try {
        const { parts, ...questionData } = req.body;

        const question = new Question(questionData);
        await question.save();

        // Agar parts yuborilgan bo‘lsa, Part schema bo‘yicha yaratiladi
        if (Array.isArray(parts) && parts.length > 0) {
            const createdParts = await Part.insertMany(
                parts.map(p => ({ ...p, collection_id: question._id })) // agar bog‘lash kerak bo‘lsa
            );

            // yangi yaratilgan Part ID larini question.parts ga qo‘shamiz
            question.parts = createdParts.map(p => p._id);
            await question.save();
        }

        res.status(201).json(question);
    } catch (err) {
        res.status(400).json({ error: (err).message });
    }
});

/**
 * READ ALL
 * POST /list
 */
router.post("/list", async (_req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: (err).message });
    }
});

/**
 * READ ONE
 * POST /get-one
 * body: { id: string }
 */
router.post("/get-one", async (req, res) => {
    try {
        const { id } = req.body;
        const question = await Question.findById(id).populate("parts");
        if (!question) return res.status(404).json({ error: "Question not found" });
        res.json(question);
    } catch (err) {
        res.status(500).json({ error: (err).message });
    }
});

/**
 * UPDATE
 * POST /update
 * body: { id: string, ...updates }
 */
router.post("/update", async (req, res) => {
    try {
        const { id, ...updates } = req.body;
        const question = await Question.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true }
        );
        if (!question) return res.status(404).json({ error: "Question not found" });
        res.json(question);
    } catch (err) {
        res.status(400).json({ error: (err).message });
    }
});

/**
 * DELETE
 * POST /delete
 * body: { id: string }
 */
router.post("/delete", async (req, res) => {
    try {
        const { id } = req.body;
        const question = await Question.findByIdAndDelete(id);
        if (!question) return res.status(404).json({ error: "Question not found" });
        res.json({ message: "Question deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: (err).message });
    }
});




/**
 * CHECK ANSWERS
 * POST /check-answers
 * body: { questionId:string, answers:string }
 */
router.post("/check-answers", async (req, res) => {
    try {
        const { questionId, answers, email } = req.body;


        if (!questionId || !Array.isArray(answers)) {
            return res.status(400).json({ error: "questionId and answers are required" });
        }
        const user = await User.findOne({ email, active: true })
        const result = await checkAnswers({ questionId, answers });

        if ("err" in result) {
            return res.status(400).json({ ...result, });
        }
        user?.answers.push(result);
        await user?.save()
        res.json(result);



    } catch (err) {

        if ((err).message === "Question not found") {
            return res.status(404).json({ error: "Question not found" });
        }

        res.status(500).json({ error: (err).message });

    }
});


export default router;
