/**
 * Test user yaratish skripti
 * Ishlatish: node setup-test-user.js
 */

import mongoose from 'mongoose';
import User from './src/models/User.js';
import Subscription from './src/models/Subscription.js';
import Tarif from './src/models/Tarif.js';
import { connectDB } from './src/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function setupTestUser() {
    try {
        await connectDB();
        console.log('✅ MongoDB ulandi');

        // 1. User yaratish/yangilash
        let user = await User.findOne({email: 'verified@test.com'});

        if (!user) {
            const hash = await bcrypt.hash('test123', 10);
            user = await User.create({
                email: 'verified@test.com',
                passwordHash: hash,
                isVerified: true,
                role: 'student'
            });
            console.log('✅ User yaratildi');
        } else {
            user.isVerified = true;
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            console.log('✅ User yangilandi');
        }

        // 2. Free tarifni topish/yaratish
        let freeTarif = await Tarif.findOne({degree: 'free', active: true});

        if (!freeTarif) {
            freeTarif = await Tarif.create({
                name: 'Free',
                type: 'package',
                degree: 'free',
                description: 'Bepul tarif',
                tests_count: 5,
                price: 0,
                active: true
            });
            console.log('✅ Free tarif yaratildi');
        } else {
            console.log('✅ Free tarif topildi');
        }

        // 3. Subscription yaratish
        let subscription = await Subscription.findOne({
            userId: user._id,
            tarifId: freeTarif._id,
            active: true
        });

        if (!subscription) {
            subscription = await Subscription.create({
                userId: user._id,
                tarifId: freeTarif._id,
                type: freeTarif.type,
                tests_count: freeTarif.tests_count,
                active: true
            });
            console.log('✅ Subscription yaratildi');
        } else {
            // Subscriptionni yangilash (testlar sonini qaytarish)
            subscription.tests_count = freeTarif.tests_count;
            subscription.used = [];
            subscription.active = true;
            await subscription.save();
            console.log('✅ Subscription yangilandi (tests reset)');
        }

        // 4. Token yaratish
        const token = jwt.sign(
            {id: user._id, role: user.role},
            process.env.ACCESS_SECRET || 'accesssecret',
            {expiresIn: '1d'}
        );

        console.log('\n📋 USER MA\'LUMOTLARI:');
        console.log('   Email: verified@test.com');
        console.log('   Password: test123');
        console.log('   Role: student');
        console.log('   Token:', token.substring(0, 50) + '...');
        console.log('\n✅ Test user tayyor!');
        console.log('\nEndi "npm test" ni ishga tushing.');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        process.exit(1);
    }
}

setupTestUser();
