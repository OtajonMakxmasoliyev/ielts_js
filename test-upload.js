/**
 * Upload Service Test
 *
 * Ishlatish:
 * node test-upload.js
 *
 * Shartlar:
 * - Server ishga tushgan bo'lishi kerak
 * - .env faylda AWS kalitlari bo'lishi kerak
 * - Login qilingan bo'lish kerak
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_URL = "http://localhost:3000";

// Ranglar
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testUploadService() {
    log('\n🧪 AWS S3 Upload Service Test', 'magenta');
    log('='.repeat(50), 'magenta');

    try {
        // 1. Login
        log('\n1️⃣ Login qilinmoqda...', 'yellow');
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'verified@test.com',
                password: 'test123'
            })
        });

        if (!loginResponse.ok) {
            log('❌ Login muvaffaqiyatsiz!', 'red');
            log('Avval "node setup-test-user.js" ni ishga tushing.', 'yellow');
            process.exit(1);
        }

        const loginData = await loginResponse.json();
        const token = loginData.access_token;
        log('✅ Login muvaffaqiyatli', 'green');

        // 2. Test endpoint
        log('\n2️⃣ Upload endpoint test...', 'yellow');
        const testResponse = await fetch(`${API_URL}/upload/test`);
        const testData = await testResponse.json();
        log('✅ Upload service ishlamoqda', 'green');
        if (testData.endpoints) {
            log(`   Endpoints: ${Object.keys(testData.endpoints).join(', ')}`, 'blue');
        }

        // 3. Avatar yuklash test (agar rasm fayli bo'lsa)
        log('\n3️⃣ Avatar yuklash test...', 'yellow');
        log('   ⚠️  Bu test uchun rasm fayli kerak', 'yellow');

        // Test uchun temporary text file yaratamiz (haqiqiy rasm emas)
        const testFilePath = 'test-upload.txt';
        fs.writeFileSync(testFilePath, 'Test file content');

        const form = new FormData();
        form.append('avatar', fs.createReadStream(testFilePath), {
            filename: 'avatar.jpg',
            contentType: 'image/jpeg'
        });

        const avatarResponse = await fetch(`${API_URL}/upload/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        const avatarData = await avatarResponse.json();

        if (avatarResponse.ok && avatarData.success) {
            log('✅ Avatar yuklash muvaffaqiyatli', 'green');
            log(`   URL: ${avatarData.url}`, 'blue');
            log(`   Key: ${avatarData.key}`, 'blue');
            log(`   Hajmi: ${avatarData.size.formatted}`, 'blue');

            // 4. Faylni o'chirish test
            log('\n4️⃣ Faylni o\'chirish test...', 'yellow');

            const deleteResponse = await fetch(`${API_URL}/upload/${encodeURIComponent(avatarData.key)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const deleteData = await deleteResponse.json();

            if (deleteResponse.ok && deleteData.success) {
                log('✅ Fayl muvaffaqiyatli o\'chirildi', 'green');
            } else {
                log('❌ Faylni o\'chirish muvaffaqiyatsiz', 'red');
                log(`   Xato: ${JSON.stringify(deleteData)}`, 'red');
            }
        } else {
            log('❌ Avatar yuklash muvaffaqiyatsiz', 'red');
            log(`   Xato: ${JSON.stringify(avatarData)}`, 'red');
        }

        // Test faylni o'chirish
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }

        log('\n✅ Test yakunlandi!', 'green');
        log('\n📝 Eslatma:', 'yellow');
        log('   - .env faylda AWS kalitlarini to\'ldiring', 'blue');
        log('   - AWS S3 bucket yarating va public bo\'lishini ta\'minlang', 'blue');
        log('   - Haqiqiy rasm fayli bilan test qiling', 'blue');

    } catch (error) {
        log(`\n❌ Xatolik: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Ishga tushirish
testUploadService();
