import mongoose, { Schema, Document } from "mongoose";
import { ISettings } from "@/types";

export interface SettingsDocument extends Omit<ISettings, "_id">, Document { }

const ProviderConfigSchema = new Schema({
    name: { type: String, enum: ["openai", "anthropic", "google"], required: true },
    apiKey: { type: String, default: "" },
    model: { type: String, required: true },
}, { _id: false });

const SettingsSchema = new Schema<SettingsDocument>(
    {
        activeProvider: {
            type: String,
            enum: ["openai", "anthropic", "google"],
            default: "openai"
        },
        providers: {
            type: [ProviderConfigSchema],
            default: [
                { name: "openai", apiKey: "", model: "gpt-4o" },
                { name: "anthropic", apiKey: "", model: "claude-3-5-sonnet-latest" },
                { name: "google", apiKey: "", model: "gemini-1.5-pro" }
            ]
        }
    },
    { timestamps: true }
);

if (mongoose.models.Settings) {
    mongoose.deleteModel("Settings");
}

export default mongoose.model<SettingsDocument>("Settings", SettingsSchema);
