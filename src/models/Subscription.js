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
    tests_count: {
        type: Number,
        required: true,
        min: 1
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
        default: null
    }
}, { timestamps: true });

// Virtual field - qolgan testlar soni
SubscriptionSchema.virtual("remaining_tests").get(function() {
    return this.tests_count - this.used.length;
});

// Virtual field - finishedmi yoki yo'q
SubscriptionSchema.virtual("finished").get(function() {
    return this.used.length >= this.tests_count;
});

// JSON ga virtual fieldlarni qo'shish
SubscriptionSchema.set("toJSON", { virtuals: true });
SubscriptionSchema.set("toObject", { virtuals: true });

export default model("Subscription", SubscriptionSchema);