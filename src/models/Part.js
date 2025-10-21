import { Schema, model, Document } from 'mongoose';



const PartSchema = new Schema(
    {
        markdown: { type: String },
        // answers ichida string ham, string[] ham bo‘lishi mumkin
        answers: { type: [Schema.Types.Mixed], required: true },
        collection_id: { type: Schema.Types.ObjectId, required: true },
        part_type: [{ type: String, required: true }]
    },
    { timestamps: true }
);

export default model('Part', PartSchema);




