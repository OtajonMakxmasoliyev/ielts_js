/**
 * AWS S3 Service - Fayl yuklash va boshqarish
 *
 * Funktsionallik:
 * - Fayl yuklash (upload)
 * - Fayl o'chirish (delete)
 * - Fayl URL olish (get URL)
 * - Ko'p fayllarni yuklash (multiple upload)
 */

import {S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// S3 Client konfiguratsiyasi
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1', credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Bucket nomi
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'ielts-platform';

/**
 * Fayl yuklash S3 ga
 * @param {File|Buffer} file - Fayl yoki buffer
 * @param {string} key - Fayl yo'li (masalan: 'uploads/avatar.jpg')
 * @param {string} contentType - Fayl turi (masalan: 'image/jpeg')
 * @returns {Promise<string>} - Fayl URL
 */
export async function uploadFileToS3(file, key, contentType) {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME, Key: key, Body: file, ContentType: contentType
        });

        await s3Client.send(command);

        // Fayl URL qaytarish
        const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

        return {
            success: true, url: fileUrl, key: key
        };
    } catch (error) {
        console.error('S3 ga yuklashda xatolik:', error);
        return {
            success: false, error: error.message
        };
    }
}

/**
 * Faylni S3 dan o'chirish
 * @param {string} key - Fayl yo'li
 * @returns {Promise<boolean>}
 */
export async function deleteFileFromS3(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME, Key: key
        });

        await s3Client.send(command);

        return {
            success: true, message: 'Fayl muvaffaqiyatli o\'chirildi'
        };
    } catch (error) {
        console.error('S3 dan o\'chirishda xatolik:', error);
        return {
            success: false, error: error.message
        };
    }
}

/**
 * Presigned URL olish (vaqtinchalik havola)
 * @param {string} key - Fayl yo'li
 * @param {number} expiresIn - Seconds (default: 3600 = 1 soat)
 * @returns {Promise<string>}
 */
export async function getPresignedUrl(key, expiresIn = 3600) {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME, Key: key
        });

        const url = await getSignedUrl(s3Client, command, {expiresIn});

        return {
            success: true, url: url
        };
    } catch (error) {
        console.error('Presigned URL olishda xatolik:', error);
        return {
            success: false, error: error.message
        };
    }
}

/**
 * Ko'p fayllarni yuklash
 * @param {Array} files - Fayllar massivi
 * @param {string} folder - Papka nomi (masalan: 'avatars', 'documents')
 * @returns {Promise<Array>}
 */
export async function uploadMultipleFiles(files, folder = 'uploads') {
    try {
        const uploadPromises = files.map(async (file) => {
            // Fayl nomini generatsiya qilish: timestamp + random + extension
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const extension = file.originalname.split('.').pop();
            const key = `${folder}/${timestamp}-${random}.${extension}`;

            return await uploadFileToS3(file.buffer, key, file.mimetype);
        });

        const results = await Promise.all(uploadPromises);

        return {
            success: true, files: results
        };
    } catch (error) {
        console.error('Ko\'p fayllarni yuklashda xatolik:', error);
        return {
            success: false, error: error.message
        };
    }
}

/**
 * Fayl nomini toza qilish (maxsus belgilarni olib tashlash)
 * @param {string} filename - Fayl nomi
 * @returns {string}
 */
export function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
}

/**
 * Fayl hajmini formatlash
 * @param {number} bytes - Baytlar
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Rasm formatini tekshirish
 * @param {string} mimetype - Fayl turi
 * @returns {boolean}
 */
export function isImage(mimetype) {
    return mimetype.startsWith('image/');
}

/**
 * PDF formatini tekshirish
 * @param {string} mimetype - Fayl turi
 * @returns {boolean}
 */
export function isPDF(mimetype) {
    return mimetype === 'application/pdf';
}

/**
 * Fayl hajmini tekshirish
 * @param {number} size - Fayl hajmi (bytes)
 * @param {number} maxSize - Maksimal hajm (bytes)
 * @returns {boolean}
 */
export function checkFileSize(size, maxSize) {
    return size <= maxSize;
}

/**
 * Audio formatini tekshirish
 * @param {string} mimetype - Fayl turi
 * @returns {boolean}
 */
export function isAudio(mimetype) {
    const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav',
                        'audio/wave', 'audio/x-wav', 'audio/mp4',
                        'audio/x-m4a', 'audio/ogg', 'audio/vorbis'];
    return audioTypes.includes(mimetype);
}

/**
 * Audio formatini olish
 * @param {string} mimetype - Fayl turi
 * @returns {string}
 */
export function getAudioFormat(mimetype) {
    const formatMap = {
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
        'audio/wav': 'wav', 'audio/wave': 'wav',
        'audio/x-wav': 'wav', 'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a', 'audio/ogg': 'ogg',
        'audio/vorbis': 'ogg'
    };
    return formatMap[mimetype] || 'unknown';
}

export default {
    uploadFileToS3,
    deleteFileFromS3,
    getPresignedUrl,
    uploadMultipleFiles,
    sanitizeFilename,
    formatFileSize,
    isImage,
    isPDF,
    checkFileSize,
    isAudio,
    getAudioFormat
};
