import express from "express";
import Tarif from "../../models/Tarif.js";

const router = express.Router();

/**
 * @swagger
 * /tarif/list:
 *   post:
 *     summary: Barcha aktiv tariflarni ko'rish
 *     tags: [Tarif]
 *     responses:
 *       200:
 *         description: Tariflar ro'yxati
 */
router.post("/list", async (req, res) => {
    try {
        const tarifs = await Tarif.find({active: true}).sort({type: 1, price: 1});

        // Tariflarni turlarga ajratish
        const packages = tarifs.filter(t => t.type === "package");
        const premiums = tarifs.filter(t => t.type === "premium");

        res.json({
            packages, premiums, all: tarifs
        });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /tarif/get-one:
 *   post:
 *     summary: Bitta tarifni ko'rish
 *     tags: [Tarif]
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
 *     responses:
 *       200:
 *         description: Tarif ma'lumotlari
 *       404:
 *         description: Tarif topilmadi
 */
router.post("/get-one", async (req, res) => {
    try {
        const {id} = req.body;
        const tarif = await Tarif.findById(id);
        if (!tarif) {
            return res.status(404).json({error: "Tarif topilmadi"});
        }
        res.json(tarif);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// ============= ADMIN ROUTES =============

/**
 * @swagger
 * /tarif/create:
 *   post:
 *     summary: Yangi tarif yaratish (Admin)
 *     tags: [Tarif]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - price
 *               - degree
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Oylik"
 *               type:
 *                 type: string
 *                 enum: [package, premium]
 *                 example: "premium"
 *               degree:
 *                 type: string
 *                 enum: [free, limited]
 *                 example: "limited"
 *               description:
 *                 type: string
 *                 example: "Oylik premium tarif"
 *               tests_count:
 *                 type: number
 *                 example: 50
 *                 description: "Faqat package uchun"
 *               price:
 *                 type: number
 *                 example: 99000
 *               duration_days:
 *                 type: number
 *                 example: 30
 *                 description: "Faqat premium uchun"
 *     responses:
 *       201:
 *         description: Tarif yaratildi
 *       400:
 *         description: Xato ma'lumot
 *       403:
 *         description: Ruxsat yo'q
 */
router.post("/create", async (req, res) => {
    try {
        // Admin tekshiruvi
        if (req.user.role !== "admin") {
            return res.status(403).json({error: "Faqat admin tarif yarata oladi"});
        }

        const {name, type, description, tests_count, price, duration_days, degree} = req.body;

        if (!name || !type || price === undefined) {
            return res.status(400).json({error: "name, type va price talab qilinadi"});
        }

        // Validatsiya
        if (type === "package" && !tests_count) {
            return res.status(400).json({error: "Package uchun tests_count talab qilinadi"});
        }

        if (type === "premium" && !duration_days) {
            return res.status(400).json({error: "Premium uchun duration_days talab qilinadi"});
        }

        const tarif = new Tarif({
            name,
            type,
            description,
            tests_count: type === "package" ? tests_count : null,
            price,
            duration_days: type === "premium" ? duration_days : null,
            degree
        });

        await tarif.save();
        res.status(201).json(tarif);

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({error: "Bu nomdagi tarif allaqachon mavjud"});
        }
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /tarif/update:
 *   post:
 *     summary: Tarifni yangilash (Admin)
 *     tags: [Tarif]
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
 *               name:
 *                 type: string
 *               tests_count:
 *                 type: number
 *               price:
 *                 type: number
 *               duration_days:
 *                 type: number
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tarif yangilandi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Tarif topilmadi
 */
router.post("/update", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({error: "Faqat admin tarifni yangilay oladi"});
        }

        const {id, ...updates} = req.body;

        // type ni o'zgartirish mumkin emas
        delete updates.type;

        const tarif = await Tarif.findByIdAndUpdate(id, {...updates, updatedAt: new Date()}, {new: true});

        if (!tarif) {
            return res.status(404).json({error: "Tarif topilmadi"});
        }

        res.json(tarif);

    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /tarif/delete:
 *   post:
 *     summary: Tarifni o'chirish (Admin)
 *     tags: [Tarif]
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
 *     responses:
 *       200:
 *         description: Tarif o'chirildi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Tarif topilmadi
 */
router.post("/delete", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({error: "Faqat admin tarifni o'chira oladi"});
        }

        const {id} = req.body;

        // Soft delete - faqat active ni false qilish
        const tarif = await Tarif.findByIdAndUpdate(id, {active: false}, {new: true});

        if (!tarif) {
            return res.status(404).json({error: "Tarif topilmadi"});
        }

        res.json({message: "Tarif o'chirildi", tarif});

    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /tarif/all:
 *   post:
 *     summary: Barcha tariflarni ko'rish (Admin)
 *     tags: [Tarif]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Barcha tariflar (aktiv va noaktiv)
 *       403:
 *         description: Ruxsat yo'q
 */
router.post("/all", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({error: "Faqat admin ko'ra oladi"});
        }

        const tarifs = await Tarif.find().sort({createdAt: -1});
        res.json(tarifs);

    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

export default router;