import mongoose, { Schema, Document } from "mongoose";
import { IReserve } from "@/types";

export interface ReserveDocument extends Omit<IReserve, "_id">, Document { }

const ReserveSchema = new Schema<ReserveDocument>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["tax", "maintenance", "emergency", "custom"], required: true },
        balance: { type: Number, required: true, default: 0 },
        target: { type: Number, required: true, default: 0 },
        dueDate: { type: String },
        allocationPercent: { type: Number },
        linkedAssetId: { type: Schema.Types.ObjectId, ref: "Asset" },
    },
    { timestamps: true }
);

if (mongoose.models.Reserve) {
    mongoose.deleteModel("Reserve");
}

export default mongoose.model<ReserveDocument>("Reserve", ReserveSchema);
