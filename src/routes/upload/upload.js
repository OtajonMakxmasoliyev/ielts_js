/**
 * Upload Routes
 *
 * Endpointlar:
 * POST /upload/avatar - Avatar yuklash
 * POST /upload/document - Document yuklash
 * POST /upload/files - Ko'p fayllarni yuklash
 * DELETE /upload/:key - Faylni o'chirish
 * GET /upload/test - Test endpoint
 */

import express from 'express';
import { uploadAvatar, uploadDocument, uploadFiles, uploadAudioFile } from '../../middleware/upload.js';
import {
    uploadFileToS3,
    deleteFileFromS3,
    sanitizeFilename,
    isImage,
    isPDF,
    isAudio,
    getAudioFormat,
    formatFileSize
} from '../../services/s3Service.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Fayl yuklash va boshqarish API (AWS S3)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Fayl muvaffaqiyatli yuklandi"
 *         url:
 *           type: string
 *           example: "https://bucket.s3.amazonaws.com/avatars/file.jpg"
 *         key:
 *           type: string
 *           example: "avatars/1234567890-abc123.jpg"
 *         size:
 *           type: object
 *           properties:
 *             bytes:
 *               type: integer
 *               example: 102400
 *             formatted:
 *               type: string
 *               example: "100.00 KB"
 */

/**
 * @swagger
 * /upload/test:
 *   get:
 *     summary: Upload service test endpointi
 *     description: Upload service ishlashini tekshirish uchun
 *     tags: [Upload]
 *     security: []
 *     responses:
 *       200:
 *         description: Service ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                 requirements:
 *                   type: object
 */
router.get("/test", async (req, res) => {
    res.json({
        message: 'Upload service ishlamoqda',
        endpoints: {
            avatar: 'POST /upload/avatar',
            document: 'POST /upload/document',
            audio: 'POST /upload/audio',
            files: 'POST /upload/files',
            delete: 'DELETE /upload/:key'
        },
        requirements: {
            contentType: 'multipart/form-data',
            maxSize: '5MB (image/PDF), 20MB (audio)',
            allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp3', 'wav', 'm4a', 'ogg'],
            maxFiles: 10
        }
    });
});

/**
 * @swagger
 * /upload/avatar:
 *   post:
 *     summary: Avatar yuklash
 *     description: Foydalanuvchi profil rasmini yuklash (faqat rasm)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Rasm fayli (jpg, jpeg, png, gif, webp)
 *     responses:
 *       200:
 *         description: Avatar muvaffaqiyatli yuklandi
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/UploadResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Avatar muvaffaqiyatli yuklandi"
 *       400:
 *         description: Xato - Fayl yuborilmagan yoki noto'g'ri format
 *       401:
 *         description: Avtorizatsiya xatosi
 *       500:
 *         description: Server xatoligi
 */
router.post("/avatar", authMiddleware, uploadAvatar, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: {
                    code: 'NO_FILE',
                    message: 'Fayl yuborilmagan'
                }
            });
        }

        // User ID orqali papka yaratish
        const userId = req.user.id;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = req.file.originalname.split('.').pop();
        const filename = sanitizeFilename(req.file.originalname);

        // Fayl yo'li: avatars/userId-timestamp-random.ext
        const key = `avatars/${userId}-${timestamp}-${random}.${extension}`;

        // S3 ga yuklash
        const result = await uploadFileToS3(req.file.buffer, key, req.file.mimetype);

        if (!result.success) {
            return res.status(500).json({
                error: {
                    code: 'UPLOAD_FAILED',
                    message: 'Faylni yuklashda xatolik'
                }
            });
        }

        // User modelga avatar URL ni saqlash (ixtiyoriy)
        // await User.findByIdAndUpdate(userId, { avatar: result.url });

        res.json({
            success: true,
            message: 'Avatar muvaffaqiyatli yuklandi',
            url: result.url,
            key: result.key,
            size: {
                bytes: req.file.size,
                formatted: `${(req.file.size / 1024).toFixed(2)} KB`
            }
        });

    } catch (error) {
        console.error('Avatar yuklash xatolik:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Server xatoligi'
            }
        });
    }
});

/**
 * @swagger
 * /upload/document:
 *   post:
 *     summary: Document yuklash
 *     description: Hujjat yuklash (rasm yoki PDF)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Hujjat fayli (rasm yoki PDF)
 *     responses:
 *       200:
 *         description: Document muvaffaqiyatli yuklandi
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/UploadResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Document muvaffaqiyatli yuklandi"
 *                     type:
 *                       type: string
 *                       enum: [pdf, image]
 *                       example: "pdf"
 *       400:
 *         description: Xato - Fayl yuborilmagan
 *       401:
 *         description: Avtorizatsiya xatosi
 *       500:
 *         description: Server xatoligi
 */
router.post("/document", authMiddleware, uploadDocument, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: {
                    code: 'NO_FILE',
                    message: 'Fayl yuborilmagan'
                }
            });
        }

        const userId = req.user.id;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = req.file.originalname.split('.').pop();
        const filename = sanitizeFilename(req.file.originalname);

        // Fayl turi bo'yicha papka tanlash
        const folder = isPDF(req.file.mimetype) ? 'documents/pdf' : 'documents/images';
        const key = `${folder}/${userId}-${timestamp}-${random}.${extension}`;

        // S3 ga yuklash
        const result = await uploadFileToS3(req.file.buffer, key, req.file.mimetype);

        if (!result.success) {
            return res.status(500).json({
                error: {
                    code: 'UPLOAD_FAILED',
                    message: 'Faylni yuklashda xatolik'
                }
            });
        }

        res.json({
            success: true,
            message: 'Document muvaffaqiyatli yuklandi',
            url: result.url,
            key: result.key,
            type: isPDF(req.file.mimetype) ? 'pdf' : 'image',
            size: {
                bytes: req.file.size,
                formatted: `${(req.file.size / 1024).toFixed(2)} KB`
            }
        });

    } catch (error) {
        console.error('Document yuklash xatolik:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Server xatoligi'
            }
        });
    }
});

/**
 * @swagger
 * /upload/audio:
 *   post:
 *     summary: Audio yuklash
 *     description: IELTS Listening test uchun audio fayl yuklash (mp3, wav, m4a, ogg)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio fayli (mp3, wav, m4a, ogg)
 *     responses:
 *       200:
 *         description: Audio muvaffaqiyatli yuklandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Audio muvaffaqiyatli yuklandi"
 *                 url:
 *                   type: string
 *                   example: "https://bucket.s3.amazonaws.com/audios/file.mp3"
 *                 key:
 *                   type: string
 *                   example: "audios/1234567890-abc123.mp3"
 *                 format:
 *                   type: string
 *                   example: "mp3"
 *                 size:
 *                   type: object
 *                   properties:
 *                     bytes:
 *                       type: integer
 *                       example: 5242880
 *                     formatted:
 *                       type: string
 *                       example: "5.00 MB"
 *       400:
 *         description: Xato - Fayl yuborilmagan yoki noto'g'ri format
 *       401:
 *         description: Avtorizatsiya xatosi
 *       500:
 *         description: Server xatoligi
 */
router.post("/audio", authMiddleware, uploadAudioFile, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: {
                    code: 'NO_FILE',
                    message: 'Audio fayl yuborilmagan'
                }
            });
        }

        const userId = req.user.id;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = req.file.originalname.split('.').pop();
        const filename = sanitizeFilename(req.file.originalname);

        // Fayl yo'li: audios/userId-timestamp-random.ext
        const key = `audios/${userId}-${timestamp}-${random}.${extension}`;

        // S3 ga yuklash
        const result = await uploadFileToS3(req.file.buffer, key, req.file.mimetype);

        if (!result.success) {
            return res.status(500).json({
                error: {
                    code: 'UPLOAD_FAILED',
                    message: 'Audio faylni yuklashda xatolik'
                }
            });
        }

        // Audio formatini aniqlash
        const format = getAudioFormat(req.file.mimetype);

        res.json({
            success: true,
            message: 'Audio muvaffaqiyatli yuklandi',
            url: result.url,
            key: result.key,
            format: format,
            size: {
                bytes: req.file.size,
                formatted: formatFileSize(req.file.size)
            }
        });

    } catch (error) {
        console.error('Audio yuklash xatolik:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Server xatoligi'
            }
        });
    }
});

/**
 * @swagger
 * /upload/files:
 *   post:
 *     summary: Ko'p fayllarni yuklash
 *     description: Bir vaqtda ko'p fayl yuklash (maksimal 10 ta)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *                 description: Fayllar massivi (rasm yoki PDF)
 *     responses:
 *       200:
 *         description: Barcha fayllar muvaffaqiyatli yuklandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "5 ta fayl muvaffaqiyatli yuklandi"
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       key:
 *                         type: string
 *       400:
 *         description: Xato - Fayllar yuborilmagan yoki juda ko'p fayl
 *       401:
 *         description: Avtorizatsiya xatosi
 *       500:
 *         description: Server xatoligi
 */
router.post("/files", authMiddleware, uploadFiles, async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'NO_FILES',
                    message: 'Fayllar yuborilmagan'
                }
            });
        }

        const userId = req.user.id;
        const timestamp = Date.now();

        // Har bir faylni yuklash
        const uploadPromises = req.files.map(async (file) => {
            const random = Math.random().toString(36).substring(7);
            const extension = file.originalname.split('.').pop();
            const filename = sanitizeFilename(file.originalname);

            // Fayl turi bo'yicha papka
            let folder = 'uploads';
            if (isImage(file.mimetype)) folder = 'uploads/images';
            else if (isPDF(file.mimetype)) folder = 'uploads/documents';

            const key = `${folder}/${userId}-${timestamp}-${random}.${extension}`;

            return await uploadFileToS3(file.buffer, key, file.mimetype);
        });

        const results = await Promise.all(uploadPromises);

        // Barcha yuklashlar muvaffaqiyatli bo'lishini tekshirish
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            return res.status(500).json({
                error: {
                    code: 'PARTIAL_UPLOAD_FAILED',
                    message: `${failed.length} ta faylni yuklashda xatolik`
                }
            });
        }

        res.json({
            success: true,
            message: `${results.length} ta fayl muvaffaqiyatli yuklandi`,
            files: results.map(r => ({
                url: r.url,
                key: r.key
            }))
        });

    } catch (error) {
        console.error('Files yuklash xatolik:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Server xatoligi'
            }
        });
    }
});

/**
 * @swagger
 * /upload/{key}:
 *   delete:
 *     summary: Faylni o'chirish
 *     description: S3 dan faylni o'chirish
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Fayl yo'li (URL encoded)
 *         example: "avatars/1234567890-abc123.jpg"
 *     responses:
 *       200:
 *         description: Fayl muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Fayl muvaffaqiyatli o'chirildi"
 *       401:
 *         description: Avtorizatsiya xatosi
 *       500:
 *         description: Server xatoligi
 */
router.delete("/:key", authMiddleware, async (req, res) => {
    try {
        const key = req.params.key;

        // URL encoded kalitni decode qilish
        const decodedKey = decodeURIComponent(key);

        // Faylni o'chirish
        const result = await deleteFileFromS3(decodedKey);

        if (!result.success) {
            return res.status(500).json({
                error: {
                    code: 'DELETE_FAILED',
                    message: 'Faylni o\'chirishda xatolik'
                }
            });
        }

        res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('Fayl o\'chirish xatolik:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                message: 'Server xatoligi'
            }
        });
    }
});

export default router;
