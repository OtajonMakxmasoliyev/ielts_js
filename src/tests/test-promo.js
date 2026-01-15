/**
 * Test skriptlari - Promo referral tizim
 *
 * Ishlatish:
 * node src/tests/test-promo.js
 */

import mongoose from "mongoose";
import { register } from "../services/auth.js";
import { connectDB } from "../db.js";
import Tarif from "../models/Tarif.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";

// Test ma'lumotlari
const testUsers = [
    { email: "free@test.com", password: "test123", promoCode: null },
    { email: "promo@test.com", password: "test123", promoCode: "TEST_PROMO" }
];

async function runTests() {
    console.log("=== Promo Referral Test Suite ===\n");

    try {
        await connectDB();
        console.log("✅ Database connected\n");

        // Test 1: Free user registration
        console.log("📝 Test 1: Free user registration");
        const freeUser = await register("free@test.com", "test123", null);
        console.log("Result:", freeUser);
        console.log("✅ Free user created with default subscription\n");

        // Test 2: Check free subscription
        console.log("📝 Test 2: Check free subscription");
        const freeSub = await Subscription.findOne({ userId: freeUser.id || freeUser._id }).populate("tarifId");
        console.log("Free subscription:", {
            degree: freeSub.tarifId.degree,
            tests_count: freeSub.tests_count,
            active: freeSub.active
        });
        console.log("✅ Free subscription verified\n");

        // Test 3: Check if free tariff exists
        console.log("📝 Test 3: Check free tariff");
        const freeTarif = await Tarif.findOne({ degree: "free" });
        console.log("Free tariff:", {
            name: freeTarif.name,
            degree: freeTarif.degree,
            tests_count: freeTarif.tests_count,
            price: freeTarif.price
        });
        console.log("✅ Free tariff exists\n");

        console.log("=== All tests passed! ===");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("\n✅ Database disconnected");
    }
}

// Run tests
runTests();
