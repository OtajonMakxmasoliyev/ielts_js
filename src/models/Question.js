import { Schema, model, Document, Types } from "mongoose";




const QuestionSchema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, index: true },
    type: { type: String, required: true },
    parts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Part", // bu yerda "Part" o‘rniga bog‘lanadigan collection nomini yozasiz
        }
    ],
    metadata: { type: Schema.Types.Mixed },
    attachments: [{ url: { type: String }, type: { type: String }, }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    tags: [String],
    published: { type: Boolean, default: false },
}, { timestamps: true });

export default model("Question", QuestionSchema);
