import mongoose, { Schema, Document } from "mongoose";
import { IIngestionBatch } from "@/types";

export interface IngestionBatchDocument extends Omit<IIngestionBatch, "_id">, Document { }

const StagedTransactionSchema = new Schema(
    {
        date: { type: String, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        category: { type: String, required: true },
        linkedAssetId: { type: String },
        linkedProjectId: { type: String },
        tags: [{ type: String }],
        confirmed: { type: Boolean, default: false },
    },
    { _id: false }
);

const IngestionBatchSchema = new Schema<IngestionBatchDocument>(
    {
        fileName: { type: String },
        transactions: [StagedTransactionSchema],
        totalCount: { type: Number, required: true },
        confirmedCount: { type: Number, default: 0 },
        status: { type: String, enum: ["in_review", "completed"], default: "in_review" },
        // TTL field: only set for in_review batches, cleared on completion
        expiresAt: { type: Date },
    },
    { timestamps: true }
);

// Auto-delete abandoned in_review batches (expiresAt is set on creation, cleared on completion)
IngestionBatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.IngestionBatch || mongoose.model<IngestionBatchDocument>("IngestionBatch", IngestionBatchSchema);
