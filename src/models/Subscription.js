import { Schema, model } from "mongoose";

const SubscriptionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tarifId: {
        type: Schema.Types.ObjectId,
        ref: "Tarif",
        required: true
    },
    type: {
        type: String,
        enum: ["package", "premium"],
        required: true
    },
    tests_count: {
        type: Number,
        default: null // premium uchun null (cheksiz)
    },
    used: [
        {
            testId: { type: Schema.Types.ObjectId, ref: "Question" },
            score: { type: Number },
            used_time: { type: Date, default: Date.now }
        }
    ],
    active: {
        type: Boolean,
        default: true
    },
    expired_date: {
        type: Date,
        default: null // package uchun null (muddatsiz)
    }
}, { timestamps: true });

// Virtual field - qolgan testlar soni (faqat package uchun)
SubscriptionSchema.virtual("remaining_tests").get(function() {
    if (this.type === "premium") return null; // cheksiz
    return this.tests_count - this.used.length;
});

// Virtual field - finishedmi yoki yo'q
SubscriptionSchema.virtual("finished").get(function() {
    if (this.type === "package") {
        // Paket: testlar tugaganda
        return this.used.length >= this.tests_count;
    } else {
        // Premium: muddat tugaganda
        if (!this.expired_date) return false;
        return new Date() > this.expired_date;
    }
});

// JSON ga virtual fieldlarni qo'shish
SubscriptionSchema.set("toJSON", { virtuals: true });
SubscriptionSchema.set("toObject", { virtuals: true });

export default model("Subscription", SubscriptionSchema);