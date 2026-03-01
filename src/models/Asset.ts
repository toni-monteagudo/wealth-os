import mongoose, { Schema, Document } from "mongoose";
import { IAsset } from "@/types";

export interface AssetDocument extends Omit<IAsset, "_id">, Document { }

const AssetSchema = new Schema<AssetDocument>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["real_estate", "business"], required: true },
        value: { type: Number, required: true, default: 0 },
        location: { type: String },
        purchasePrice: { type: Number },
        purchaseDate: { type: String },
        area: { type: Number },
        image: { type: String },
        rentalYield: { type: Number },
        mrr: { type: Number },
        momGrowth: { type: Number },
        employees: [
            {
                name: { type: String },
                avatar: { type: String },
            },
        ],
        monthlyPayroll: { type: Number },
        tenants: [
            {
                name: { type: String },
                avatar: { type: String },
                contractUntil: { type: String },
                monthlyRent: { type: Number },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.models.Asset || mongoose.model<AssetDocument>("Asset", AssetSchema);
