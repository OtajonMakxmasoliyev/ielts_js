import { Schema, model, Document } from 'mongoose';



const PartSchema = new Schema(
    {
        markdown: { type: String },
        // answers ichida string ham, string[] ham bo'lishi mumkin
        answers: { type: [Schema.Types.Mixed], required: true },
        collection_id: { type: Schema.Types.ObjectId, required: true },
        part_type: [{ type: String, required: true }],
        // Audio ma'lumotlari (Listening test uchun)
        audio: {
            url: { type: String },           // S3 URL
            key: { type: String },           // S3 kaliti (uchun o'chirish)
            duration: { type: Number },      // Davomiyligi (sekund)
            format: { type: String },        // Format (mp3, wav, m4a, ogg)
            size: { type: Number }           // Hajmi (bytes)
        },
        transcript: { type: String },        // Transkript matni
        audioMetadata: { type: Schema.Types.Mixed } // Qo'shimcha metadata
    },
    { timestamps: true }
);

export default model('Part', PartSchema);




