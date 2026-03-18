import mongoose, { Schema, Document } from "mongoose";
import { ITransaction } from "@/types";

export interface TransactionDocument extends Omit<ITransaction, "_id">, Document { }

const TransactionSchema = new Schema<TransactionDocument>(
    {
        date: { type: String, required: true },
        description: { type: String, required: true },
        friendlyDescription: { type: String },
        amount: { type: Number, required: true },
        category: { type: String, required: true },
        tags: [{ type: String }],
        status: { type: String, enum: ["confirmed", "needs_review"], required: true },
        splits: [
            {
                category: { type: String },
                amount: { type: Number },
            },
        ],
        linkedProjectId: { type: Schema.Types.ObjectId, ref: "Project" },
        linkedAssetId: { type: Schema.Types.ObjectId, ref: "Asset" },
        batchId: { type: Schema.Types.ObjectId, ref: "IngestionBatch" },
        source: { type: String, enum: ["manual", "csv_import"], required: true },
        processingTime: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model<TransactionDocument>("Transaction", TransactionSchema);
