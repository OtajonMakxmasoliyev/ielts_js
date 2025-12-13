import { Schema, model } from "mongoose";

const TarifSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ""
    },
    tests_count: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration_days: {
        type: Number,
        default: null // null = cheksiz muddat
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default model("Tarif", TarifSchema);