import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();


router.post("/:examId", authMiddleware, async (req, res) => {
    try {
        const { examId } = req.params;
        const { answers } = req.body;
        const userId = req.user?.id; // bu global declaration orqali keladi

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!answers || typeof answers !== "object") {
            return res.status(400).json({ message: "Invalid answers format" });
        }

        user.answers.push({
            examId,
            answers,
            submittedAt: new Date(),
        });

        await user.save();

        return res.json({ message: "Answers saved successfully" });
    } catch (error) {
        console.error("Error saving answers:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

export default router;
