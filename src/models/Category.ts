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
    "VIVIENDA",
    "SUMINISTROS",
    "ALIMENTACION",
    "OCIO Y RESTAURACION",
    "TRANSPORTE",
    "SALUD",
    "COMPRAS PERSONALES",
    "SEGUROS",
    "SUSCRIPCIONES",
    "EDUCACION",
    "IMPUESTOS Y COMISIONES",
    "FINANCIACION Y DEUDA",
    "INVERSION",
    "INGRESOS",
    "TRASPASOS Y TRANSFERENCIAS",
    "OTROS",
];
