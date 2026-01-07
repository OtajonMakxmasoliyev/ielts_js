import {Schema, model} from "mongoose";

const TarifSchema = new Schema({
    name: {
        type: String, required: true, unique: true
    }, type: {
        type: String, enum: ["package", "premium"], required: true
        // package = cheklangan testlar, muddatsiz
        // premium = cheksiz testlar, muddatli
    }, degree: {
        type: String, enum: ['free', 'limited'], default: "limited"
    }, description: {
        type: String, default: ""
    }, tests_count: {
        type: Number, default: null // premium uchun null (cheksiz)
    }, price: {
        type: Number, required: true, min: 0
    }, duration_days: {
        type: Number, default: null // package uchun null (muddatsiz)
    }, active: {
        type: Boolean, default: true
    }
}, {timestamps: true});

export default model("Tarif", TarifSchema);