import mongoose, { Schema, Document } from "mongoose";
import { IIngestionBatch } from "@/types";

export interface IngestionBatchDocument extends Omit<IIngestionBatch, "_id">, Document { }

const StagedTransactionSchema = new Schema(
    {
        date: { type: String, required: true },
        description: { type: String, required: true },
        friendlyDescription: { type: String },
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
        suggestedCategories: [{ type: String }],
        useOnlyExistingCategories: { type: Boolean, default: false },
        totalCount: { type: Number, required: true },
        confirmedCount: { type: Number, default: 0 },
        status: { type: String, enum: ["in_review", "completed"], default: "in_review" },
        // TTL field: only set for in_review batches, cleared on completion
        expiresAt: { type: Date },
        processingStats: {
            parseTimeMs: { type: Number },
            categorizeTimeMs: { type: Number },
            totalChunks: { type: Number },
            retriedChunks: { type: Number },
            fallbackChunks: { type: Number },
        },
    },
    { timestamps: true }
);

// Auto-delete abandoned in_review batches (expiresAt is set on creation, cleared on completion)
IngestionBatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Force model recompilation in development to pick up schema changes
if (mongoose.models.IngestionBatch) {
    mongoose.deleteModel("IngestionBatch");
}

export default mongoose.model<IngestionBatchDocument>("IngestionBatch", IngestionBatchSchema);
