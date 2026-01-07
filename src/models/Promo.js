import {Schema, model} from "mongoose";


const PromoSchema = new Schema({
    // Promokodning o'zi (masalan: UMID_IELTS)
    code: {
        type: String, required: true, unique: true, uppercase: true, trim: true
    },

    // Yangi kelgan foydalanuvchiga beriladigan tarif
    tarifId: {
        type: Schema.Types.ObjectId, ref: "Tarif", required: true
    },

    // Promokod egasi (Influencer)
    ownerId: {
        type: Schema.Types.ObjectId, ref: "User", required: true
    },

    // Har necha kishi o'tganda bonus berilishi (Masalan: 3)
    required_referrals: {
        type: Number, default: 3
    },

    // Influencerga qo'shiladigan testlar soni (Masalan: 10)
    reward_tests: {
        type: Number, default: 10
    },

    // Jami promokoddan foydalanganlar soni
    used_count: {
        type: Number, default: 0
    },

    // Promokodning umumiy maksimal ishlatilish limiti (ixtiyoriy)
    usage_limit: {
        type: Number, default: 1000
    },

    // Amal qilish muddati
    expire_date: {
        type: Date, required: true
    }, rewardTarifId: {type: Schema.Types.ObjectId, ref: "Tarif", required: true}, // Aktivlik holati
    active: {
        type: Boolean, default: true
    }
}, {timestamps: true});

export default model("Promo", PromoSchema);

