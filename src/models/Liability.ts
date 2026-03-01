import mongoose, { Schema, Document } from "mongoose";
import { ILiability } from "@/types";

export interface LiabilityDocument extends Omit<ILiability, "_id">, Document { }

const LiabilitySchema = new Schema<LiabilityDocument>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["mortgage", "loan"], required: true },
        balance: { type: Number, required: true, default: 0 },
        interestRate: { type: Number, required: true, default: 0 },
        monthlyPayment: { type: Number, required: true, default: 0 },
        bank: { type: String, required: true },
        loanNumber: { type: String },
        linkedAssetId: { type: Schema.Types.ObjectId, ref: "Asset" },
    },
    { timestamps: true }
);

export default mongoose.models.Liability || mongoose.model<LiabilityDocument>("Liability", LiabilitySchema);
