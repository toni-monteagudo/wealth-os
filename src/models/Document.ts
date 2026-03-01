import mongoose, { Schema, Document } from "mongoose";
import { IDocument } from "@/types";

export interface DocumentSchemaType extends Omit<IDocument, "_id">, Document { }

const DocumentSchema = new Schema<DocumentSchemaType>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["property", "legal", "insurance"], required: true },
        entity: { type: String },
        fileType: { type: String },
        status: { type: String, enum: ["active", "verified", "pending"], required: true },
        uploadDate: { type: String, required: true },
        expirationDate: { type: String },
        url: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Document || mongoose.model<DocumentSchemaType>("Document", DocumentSchema);
