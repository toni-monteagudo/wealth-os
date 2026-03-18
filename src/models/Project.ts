import mongoose, { Schema, Document } from "mongoose";
import { IProject } from "@/types";

export interface ProjectDocument extends Omit<IProject, "_id">, Document { }

const ProjectSchema = new Schema<ProjectDocument>(
    {
        name: { type: String, required: true },
        description: { type: String },
        linkedAssetId: { type: Schema.Types.ObjectId, ref: "Asset" },
        budget: { type: Number, required: true, default: 0 },
        actualSpent: { type: Number, required: true, default: 0 },
        progress: { type: Number, required: true, default: 0 },
        capitalize: { type: Boolean, required: true, default: false },
        estimatedEnd: { type: String },
        expenses: [
            {
                concept: { type: String },
                category: { type: String },
                provider: { type: String },
                status: { type: String, enum: ["Pagado", "Pendiente", "Depósito"] },
                amount: { type: Number },
            },
        ],
        notes: [
            {
                text: { type: String },
                date: { type: String },
                isImportant: { type: Boolean },
            },
        ],
    },
    { timestamps: true }
);

if (mongoose.models.Project) {
    mongoose.deleteModel("Project");
}

export default mongoose.model<ProjectDocument>("Project", ProjectSchema);
