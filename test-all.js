/**
 * IELTS JS - To'liq Test Skripti
 *
 * Ishlatish:
 * node test-all.js
 *
 * Shartlar:
 * - Server ishga tushgan bo'lishi kerak: npm run dev
 * - MongoDB ulangan bo'lishi kerak
 */

const API_URL = "http://localhost:3000";

// Ranglar uchun
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

function logTest(testName, status, details = '') {
    const icon = status === 'PASS' ? '✅' : '❌';
    const color = status === 'PASS' ? 'green' : 'red';
    log(`${icon} ${testName}: ${status}`, color);
    if (details) log(`   ${details}`, 'blue');
}

function logSection(title) {
    log('\n' + '='.repeat(60), 'magenta');
    log(title, 'magenta');
    log('='.repeat(60), 'magenta');
}

// HTTP request funksiyasi
async function request(endpoint, method = 'POST', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        });

        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            json = { raw: text };
        }

        return {
            status: response.status,
            ok: response.ok,
            data: json
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            data: { error: error.message }
        };
    }
}

// Test natijalari
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function addResult(name, passed, details) {
    if (passed) {
        results.passed++;
        results.tests.push({ name, status: 'PASS', details });
        logTest(name, 'PASS', details);
    } else {
        results.failed++;
        results.tests.push({ name, status: 'FAIL', details });
        logTest(name, 'FAIL', details);
    }
}

// ========== TESTLAR ==========

async function testServerConnection() {
    logSection('1. SERVER ULANISHI');
    try {
        const response = await fetch(`${API_URL}/tarif/list`);
        if (response.ok || response.status === 401) {
            addResult('Serverga ulanish', true, `Server ishlayapti`);
            return true;
        } else {
            addResult('Serverga ulanish', false, `Server javob bermayapti`);
            return false;
        }
    } catch (error) {
        addResult('Serverga ulanish', false, `Xatolik: ${error.message}`);
        return false;
    }
}

async function testRegister() {
    logSection('2. REGISTER (OTP YUBORISH)');

    // Test user yaratish
    const testEmail = `test_${Date.now()}@test.com`;
    const response = await request('/auth/register', 'POST', {
        email: testEmail,
        password: 'test123'
    });

    if (response.status === 200 && response.data.requiresVerification) {
        addResult('Register - OTP yuborish', true, 'OTP yuborildi');
        return { email: testEmail, success: true };
    } else {
        addResult('Register - OTP yuborish', false, JSON.stringify(response.data));
        return { email: testEmail, success: false };
    }
}

async function testResendOTP(email) {
    logSection('3. RESEND OTP');

    const response = await request('/auth/resend', 'POST', { email });

    if (response.status === 200 && response.data.message) {
        addResult('Resend OTP', true, 'OTP qayta yuborildi');
        return true;
    } else {
        addResult('Resend OTP', false, JSON.stringify(response.data));
        return false;
    }
}

async function testLoginBeforeVerify(email) {
    logSection('4. LOGIN - TASDIQLANMAGAN USER');

    const response = await request('/auth/login', 'POST', {
        email,
        password: 'test123'
    });

    if (response.status === 400 && response.data.error?.includes('tasdiqlanmagan')) {
        addResult('Login - isVerified tekshiruvi', true, 'Tasdiqlanmagan user login qila olmadi');
        return true;
    } else {
        addResult('Login - isVerified tekshiruvi', false, 'Tasdiqlanmagan user login qila oldi!');
        return false;
    }
}

async function testVerifyOTP(email) {
    logSection('5. SETUP TEST USER');

    log('   Avval test user yaratilmoqda...', 'yellow');

    const { execSync } = await import('child_process');

    try {
        // Setup script ni ishga tushirish
        execSync('node setup-test-user.js', {
            cwd: 'D:\\dev\\ielts_js',
            stdio: 'pipe',
            timeout: 15000
        });

        // Login qilib token olish
        const loginResponse = await request('/auth/login', 'POST', {
            email: 'verified@test.com',
            password: 'test123'
        });

        if (loginResponse.status === 200 && loginResponse.data.access_token) {
            addResult('Test user setup', true, 'Verified user + subscription yaratildi');
            return {
                email: 'verified@test.com',
                token: loginResponse.data.access_token,
                hasFreeSubscription: true
            };
        } else {
            addResult('Test user setup', false, 'Login muvaffaqiyatsiz');
            return null;
        }

    } catch (error) {
        addResult('Test user setup', false, error.message);
        return null;
    }
}

async function testLoginVerified(user) {
    logSection('6. LOGIN - TASDIQLANGAN USER');

    const response = await request('/auth/login', 'POST', {
        email: user.email,
        password: 'test123'
    });

    if (response.status === 200 && response.data.access_token) {
        addResult('Login - verified user', true, 'Muvaffaqiyatli login');
        return response.data.access_token;
    } else {
        addResult('Login - verified user', false, JSON.stringify(response.data));
        return null;
    }
}

async function testQuestionsList(token) {
    logSection('7. QUESTIONS LIST (DEGREE FILTER)');

    const response = await request('/questions/list', 'POST', null, token);

    if (response.status === 200) {
        const { degree, questions, total } = response.data;

        // Degree bo'yicha filter tekshirish
        const allFree = questions.every(q => q.metadata?.degree === 'free');

        if (degree === 'free' && allFree) {
            addResult('Questions List - degree filter', true, `Free testlar: ${total} ta`);
            return true;
        } else {
            addResult('Questions List - degree filter', false, `Filter ishlamayapti`);
            return false;
        }
    } else {
        addResult('Questions List', false, JSON.stringify(response.data));
        return false;
    }
}

async function testSubscriptionCheck(token) {
    logSection('8. SUBSCRIPTION CHECK');

    const response = await request('/subscription/check', 'POST', null, token);

    if (response.status === 200 && response.data.canTakeTest !== undefined) {
        const { canTakeTest, subscription } = response.data;
        addResult('Subscription Check', true,
            `canTakeTest: ${canTakeTest}, remaining: ${subscription?.remaining_tests || 0}`);
        return true;
    } else {
        addResult('Subscription Check', false, JSON.stringify(response.data));
        return false;
    }
}

async function testSubscriptionHistory(token) {
    logSection('9. SUBSCRIPTION HISTORY');

    const response = await request('/subscription/history', 'POST', null, token);

    if (response.status === 200) {
        addResult('Subscription History', true, `Tariflar: ${response.data.subscriptions?.length || 0}`);
        return true;
    } else {
        addResult('Subscription History', false, JSON.stringify(response.data));
        return false;
    }
}

async function testPromoList(token) {
    logSection('10. PROMO LIST');

    const response = await request('/promo/list', 'POST', null, token);

    if (response.status === 200) {
        addResult('Promo List', true, `Promokodlar: ${response.data.length || 0} ta`);
        return true;
    } else {
        addResult('Promo List', false, JSON.stringify(response.data));
        return false;
    }
}

async function testPromoStats(token) {
    logSection('11. PROMO STATS');

    // Avval promokod kodini olish
    const listResponse = await request('/promo/list', 'POST', null, token);
    if (listResponse.status !== 200 || !listResponse.data[0]?.code) {
        addResult('Promo Stats', false, 'Promokod topilmadi');
        return false;
    }

    const promoCode = listResponse.data[0].code;
    const response = await request('/promo/stats', 'POST', { code: promoCode }, token);

    if (response.status === 200 && response.data.stats) {
        addResult('Promo Stats', true,
            `Used: ${response.data.stats.used_count}, Remaining: ${response.data.stats.remaining}`);
        return true;
    } else {
        addResult('Promo Stats', false, JSON.stringify(response.data));
        return false;
    }
}

async function testQuestionsGetOne(token) {
    logSection('12. QUESTIONS GET-ONE');

    // Avval testlar ro'yxatini olish
    const listResponse = await request('/questions/list', 'POST', null, token);
    if (listResponse.status !== 200 || !listResponse.data.questions[0]?._id) {
        addResult('Questions Get-One', false, 'Savol topilmadi');
        return false;
    }

    const questionId = listResponse.data.questions[0]._id;
    const response = await request('/questions/get-one', 'POST', { id: questionId }, token);

    if (response.status === 200 && response.data._id) {
        addResult('Questions Get-One', true, `Savol: ${response.data.title}`);
        return { questionId, question: response.data };
    } else {
        addResult('Questions Get-One', false, JSON.stringify(response.data));
        return false;
    }
}

async function testCheckAnswers(token, questionId) {
    logSection('13. CHECK ANSWERS');

    // Test javoblar
    const testAnswers = [
        "Britain",
        "late 18th century",
        "rural",
        "false",
        "true",
        "false",
        "not given",
        "not given"
    ];

    const response = await request('/questions/check-answers', 'POST', {
        questionId,
        answers: testAnswers
    }, token);

    if (response.status === 200 && response.data.score !== undefined) {
        const { score, total, subscription_info } = response.data;
        addResult('Check Answers', true,
            `Score: ${score}%, Total: ${total}, Remaining: ${subscription_info?.remaining_tests || 0}`);
        return true;
    } else {
        addResult('Check Answers', false, JSON.stringify(response.data));
        return false;
    }
}

async function testAuthMiddleware() {
    logSection('14. AUTH MIDDLEWARE');

    // Token siz so'rov
    const response = await request('/subscription/check', 'POST');

    if (response.status === 401 || response.data.error?.code === 'U1110') {
        addResult('Auth Middleware', true, 'Token bo\'lsa kirish mumkin emas');
        return true;
    } else {
        addResult('Auth Middleware', false, 'Auth ishlamayapti');
        return false;
    }
}

async function testDuplicateRegister() {
    logSection('15. DUPLICATE REGISTER');

    // Avval ro'yxatdan o'tgan email bilan yana register
    const response = await request('/auth/register', 'POST', {
        email: 'verified@test.com',
        password: 'test123'
    });

    if (response.status === 400 || response.data.error) {
        addResult('Duplicate Register', true, 'Mavjud user xatolik berdi');
        return true;
    } else {
        addResult('Duplicate Register', false, 'Duplicate tekshirilmadi');
        return false;
    }
}

// ========== MAIN ==========

async function runAllTests() {
    console.clear();
    log('\n🧪 IELTS JS - To\'liq Test Suite', 'magenta');
    log(`📅 ${new Date().toLocaleString('uz-UZ')}`, 'blue');

    const startTime = Date.now();

    // 1. Server ulanish
    const serverUp = await testServerConnection();
    if (!serverUp) {
        log('\n❌ Server ishlamayapti! Iltimos, "npm run dev" ni ishga tushing.', 'red');
        log('\nServer ishga tushirish:', 'yellow');
        log('  cd D:\\\\dev\\\\ielts_js', 'blue');
        log('  npm run dev', 'blue');
        process.exit(1);
    }

    // 2. Register
    const registerResult = await testRegister();
    if (!registerResult.success) {
        log('\n⚠️ Register failed, keyingi testlar o\'tkazilmaydi.', 'yellow');
    }

    // 3. Resend OTP
    if (registerResult.success) {
        await testResendOTP(registerResult.email);
    }

    // 4. Login before verify
    if (registerResult.success) {
        await testLoginBeforeVerify(registerResult.email);
    }

    // 5. Verify OTP
    let verifiedUser = null;
    if (registerResult.success) {
        verifiedUser = await testVerifyOTP(registerResult.email);
    }

    // 6. Login verified user
    let token = null;
    if (verifiedUser) {
        token = await testLoginVerified(verifiedUser);
    }

    // 7-14. Token bilan testlar
    if (token) {
        await testQuestionsList(token);
        await testSubscriptionCheck(token);
        await testSubscriptionHistory(token);
        await testPromoList(token);
        await testPromoStats(token);
        await testAuthMiddleware();

        // 12-13. Questions testlari
        const questionResult = await testQuestionsGetOne(token);
        if (questionResult) {
            await testCheckAnswers(token, questionResult.questionId);
        }
    }

    // 15. Duplicate register
    await testDuplicateRegister();

    // Natijalar
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logSection('TEST NATIJALARI');
    log(`📊 Umumiy testlar: ${results.passed + results.failed}`, 'blue');
    log(`✅ Muvaffaqiyatli: ${results.passed}`, 'green');
    log(`❌ Muvaffaqiyatsiz: ${results.failed}`, 'red');
    log(`⏱️  Sarflangan vaqt: ${duration} soniya`, 'blue');

    if (results.failed === 0) {
        log('\n🎉 Barcha testlar muvaffaqiyatli o\'tdi!', 'green');
    } else {
        log('\n⚠️  Ba\'zi testlar muvaffaqiyatsiz tugadi.', 'yellow');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Ishga tushirish
runAllTests().catch(error => {
    log(`\n💥 Kutilmagan xatolik: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
