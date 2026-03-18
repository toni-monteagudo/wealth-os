import mongoose, { Schema, Document } from "mongoose";
import { ICategory } from "@/types";

export interface CategoryDocument extends Omit<ICategory, "_id">, Document { }

const CategorySchema = new Schema<CategoryDocument>(
    {
        name: { type: String, required: true, unique: true },
        icon: { type: String },
        color: { type: String },
    },
    { timestamps: true }
);

if (mongoose.models.Category) {
    mongoose.deleteModel("Category");
}

export default mongoose.model<CategoryDocument>("Category", CategorySchema);

// Default categories to seed on first access
export const DEFAULT_CATEGORIES = [
    "SUPERMERCADO",
    "RESTAURANTES",
    "TRANSPORTE",
    "NOMINA",
    "ALQUILER",
    "HIPOTECA",
    "SEGUROS",
    "SUMINISTROS",
    "SUSCRIPCIONES",
    "SALUD",
    "OCIO",
    "ROPA",
    "EDUCACION",
    "TRANSFERENCIA",
    "COMISIONES",
    "IMPUESTOS",
    "INVERSION",
    "OTROS",
];
