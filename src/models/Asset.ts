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
        bedrooms: { type: Number },
        bathrooms: { type: Number },
        hasElevator: { type: Boolean },
        hasParking: { type: Boolean },
        yearBuilt: { type: Number },
        cadastralReference: { type: String },
        notes: { type: String },
        image: { type: String },
        rentalYield: { type: Number },
        keywords: [{ type: String }],
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
                phone: { type: String },
                email: { type: String },
                contractStart: { type: String },
                contractEnd: { type: String },
                monthlyRent: { type: Number },
                deposit: { type: Number },
                rentIncreases: [
                    {
                        date: { type: String },
                        newRent: { type: Number },
                    },
                ],
                notes: { type: String },
            },
        ],
    },
    { timestamps: true }
);

if (mongoose.models.Asset) {
    mongoose.deleteModel("Asset");
}

export default mongoose.model<AssetDocument>("Asset", AssetSchema);
