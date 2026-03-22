import mongoose, { Schema, Document } from "mongoose";
import { ILiability } from "@/types";

export interface LiabilityDocument extends Omit<ILiability, "_id">, Document { }

const LiabilitySchema = new Schema<LiabilityDocument>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["mortgage", "loan"], required: true },
        initialCapital: { type: Number },
        startDate: { type: String },
        termMonths: { type: Number },
        interestType: { type: String, enum: ["fixed", "variable"] },
        interestRate: { type: Number, required: true, default: 0 },
        tin: { type: Number },
        tae: { type: Number },
        lateInterestRate: { type: Number },
        amortizationCommission: { type: Number },
        cancellationCommission: { type: Number },
        paymentChargeDay: { type: Number },
        monthlyPayment: { type: Number, required: true, default: 0 },
        bank: { type: String, required: true },
        loanNumber: { type: String },
        linkedAssetId: { type: Schema.Types.ObjectId, ref: "Asset" },
    },
    { timestamps: true }
);

if (mongoose.models.Liability) {
    mongoose.deleteModel("Liability");
}

export default mongoose.model<LiabilityDocument>("Liability", LiabilitySchema);
