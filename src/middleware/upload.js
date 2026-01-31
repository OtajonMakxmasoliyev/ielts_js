/**
 * Multer Middleware - Fayl yuklash uchun konfiguratsiya
 *
 * Qo'llab-quvvatlanadigan funksionallik:
 * - Single file upload
 * - Multiple files upload
 * - Fayl hajmi va formatini tekshirish
 * - Memory storage (S3 ga yuklash uchun)
 */

import multer from 'multer';
import { isImage, isPDF, isAudio, checkFileSize, formatFileSize } from '../services/s3Service.js';

// Memory storage - fayllarni RAM da saqlaydi (S3 ga yuklash uchun qulay)
const storage = multer.memoryStorage();


// Maksimal fayl hajmi (default: 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Maksimal audio fayl hajmi
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

// Fayl filteri - faqat rasm va PDF lar
const fileFilter = (req, file, cb) => {
    // Rasm yoki PDF tekshirish
    if (isImage(file.mimetype) || isPDF(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm (jpg, jpeg, png, gif, webp) va PDF fayllariga ruxsat beriladi'), false);
    }
};

// Audio fayl filteri
const audioFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
        'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/vorbis'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Faqat audio fayllariga ruxsat beriladi (mp3, wav, m4a, ogg)'), false);
    }
};

// Multer konfiguratsiyasi
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});

// Audio uchun multer konfiguratsiyasi
export const uploadAudio = multer({
    storage: storage,
    limits: {
        fileSize: MAX_AUDIO_SIZE
    },
    fileFilter: audioFileFilter
});

/**
 * Single file upload middleware
 * Qo'llanilishi: upload.single('file')
 * 'file' - form field name
 */
export const uploadSingle = upload.single('file');

/**
 * Multiple files upload middleware
 * Qo'llanilishi: uploadMultiple.array('files', 10)
 * 'files' - form field name
 * 10 - maksimal fayl soni
 */
export const uploadMultiple = upload.array('files', 10);

/**
 * Avatar yuklash uchun middleware (faqat rasm)
 */
export const uploadAvatar = (req, res, next) => {
    const avatarUpload = upload.single('avatar');

    avatarUpload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: `Fayl hajmi juda katta. Maksimal: ${formatFileSize(MAX_FILE_SIZE)}`
                    }
                });
            }
            if (err.message.includes('Faqat rasm')) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_FILE_TYPE',
                        message: 'Faqat rasm fayllariga ruxsat beriladi (jpg, jpeg, png, gif, webp)'
                    }
                });
            }
            return res.status(400).json({
                error: {
                    code: 'UPLOAD_ERROR',
                    message: err.message
                }
            });
        }

        // Rasm ekanligini qo'shimcha tekshirish
        if (req.file && !isImage(req.file.mimetype)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_FILE_TYPE',
                    message: 'Faqat rasm fayllariga ruxsat beriladi'
                }
            });
        }

        next();
    });
};

/**
 * Document yuklash uchun middleware (rasm yoki PDF)
 */
export const uploadDocument = (req, res, next) => {
    const docUpload = upload.single('document');

    docUpload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: `Fayl hajmi juda katta. Maksimal: ${formatFileSize(MAX_FILE_SIZE)}`
                    }
                });
            }
            if (err.message.includes('Faqat rasm') || err.message.includes('PDF')) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_FILE_TYPE',
                        message: 'Faqat rasm va PDF fayllariga ruxsat beriladi'
                    }
                });
            }
            return res.status(400).json({
                error: {
                    code: 'UPLOAD_ERROR',
                    message: err.message
                }
            });
        }

        next();
    });
};

/**
 * Ko'p fayllarni yuklash uchun middleware
 */
export const uploadFiles = (req, res, next) => {
    const filesUpload = upload.array('files', 10);

    filesUpload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: `Fayl hajmi juda katta. Maksimal: ${formatFileSize(MAX_FILE_SIZE)}`
                    }
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    error: {
                        code: 'TOO_MANY_FILES',
                        message: 'Juda ko\'p fayl. Maksimal: 10 ta'
                    }
                });
            }
            return res.status(400).json({
                error: {
                    code: 'UPLOAD_ERROR',
                    message: err.message
                }
            });
        }

        next();
    });
};

/**
 * Audio faylni yuklash uchun middleware
 */
export const uploadAudioFile = (req, res, next) => {
    const audioUpload = uploadAudio.single('audio');

    audioUpload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: `Audio fayl hajmi juda katta. Maksimal: ${formatFileSize(MAX_AUDIO_SIZE)}`
                    }
                });
            }
            if (err.message.includes('Faqat audio')) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_FILE_TYPE',
                        message: 'Faqat audio fayllariga ruxsat beriladi (mp3, wav, m4a, ogg)'
                    }
                });
            }
            return res.status(400).json({
                error: {
                    code: 'UPLOAD_ERROR',
                    message: err.message
                }
            });
        }

        // Audio ekanligini qo'shimcha tekshirish
        if (req.file && !isAudio(req.file.mimetype)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_FILE_TYPE',
                    message: 'Faqat audio fayllariga ruxsat beriladi'
                }
            });
        }

        next();
    });
};

/**
 * Xatoliklarni ushlaydigan middleware
 */
export const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: `Fayl hajmi juda katta. Maksimal: ${formatFileSize(MAX_FILE_SIZE)}`
                }
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: {
                    code: 'TOO_MANY_FILES',
                    message: 'Juda ko\'p fayl'
                }
            });
        }
    }

    if (error) {
        return res.status(400).json({
            error: {
                code: 'UPLOAD_ERROR',
                message: error.message
            }
        });
    }

    next();
};

export default {
    upload,
    uploadSingle,
    uploadMultiple,
    uploadAudio,
    uploadAudioFile,
    uploadAvatar,
    uploadDocument,
    uploadFiles,
    handleUploadError
};
