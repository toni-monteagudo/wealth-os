"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IAsset } from "@/types";

interface AddAssetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INITIAL_STATE: Partial<IAsset> = {
    type: "real_estate",
    name: "",
    purchasePrice: 0,
    purchaseDate: "",
    location: "",
    area: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    hasElevator: false,
    hasParking: false,
    yearBuilt: undefined,
    cadastralReference: "",
    notes: "",
    keywords: [],
    mrr: 0,
};

export function AddAssetForm({ isOpen, onClose, onSuccess }: AddAssetFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<IAsset>>(INITIAL_STATE);

    useEffect(() => {
        if (isOpen) {
            setFormData(INITIAL_STATE);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                value: formData.purchasePrice
            };
            
            const res = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isRealEstate = formData.type === "real_estate";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Añadir Nuevo Activo">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                    label="Tipo de Activo"
                    name="type"
                    type="select"
                    value={formData.type}
                    onChange={handleChange}
                    options={[
                        { label: "Inmueble", value: "real_estate" },
                        { label: "Negocio / Digital", value: "business" },
                    ]}
                    required
                />
                
                <FormField
                    label="Nombre"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Ej. Piso en Madrid"
                    required
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Valor de Compra (€)"
                        name="purchasePrice"
                        type="number"
                        value={formData.purchasePrice || ""}
                        onChange={handleChange}
                        required
                    />
                    <FormField
                        label="Fecha de Compra"
                        name="purchaseDate"
                        type="date"
                        value={formData.purchaseDate || ""}
                        onChange={handleChange}
                    />
                </div>

                <FormField
                    label="Ubicación"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    placeholder="Ej. Calle Mayor 5, Madrid"
                />

                {isRealEstate && (
                    <>
                        <div className="h-px w-full bg-slate-100 my-1"></div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Características del Inmueble</p>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                label="Habitaciones"
                                name="bedrooms"
                                type="number"
                                value={formData.bedrooms ?? ""}
                                onChange={handleChange}
                                placeholder="3"
                            />
                            <FormField
                                label="Baños"
                                name="bathrooms"
                                type="number"
                                value={formData.bathrooms ?? ""}
                                onChange={handleChange}
                                placeholder="2"
                            />
                            <FormField
                                label="Superficie (m²)"
                                name="area"
                                type="number"
                                value={formData.area ?? ""}
                                onChange={handleChange}
                                placeholder="85"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Año de Construcción"
                                name="yearBuilt"
                                type="number"
                                value={formData.yearBuilt ?? ""}
                                onChange={handleChange}
                                placeholder="1995"
                            />
                            <FormField
                                label="Ref. Catastral"
                                name="cadastralReference"
                                value={formData.cadastralReference || ""}
                                onChange={handleChange}
                                placeholder="1234567AB1234C0001XX"
                            />
                        </div>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasElevator"
                                    checked={!!formData.hasElevator}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-emerald-600 rounded"
                                />
                                Ascensor
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="hasParking"
                                    checked={!!formData.hasParking}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-emerald-600 rounded"
                                />
                                Plaza de Garaje
                            </label>
                        </div>

                        <FormField
                            label="Notas (opcional)"
                            name="notes"
                            value={formData.notes || ""}
                            onChange={handleChange}
                            placeholder="Ej. Reformado en 2020, orientación sur..."
                        />
                    </>
                )}

                {formData.type === "business" && (
                    <FormField
                        label="MRR (€)"
                        name="mrr"
                        type="number"
                        value={formData.mrr || ""}
                        onChange={handleChange}
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Palabras Clave (para auto-asignación IA)</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {(formData.keywords || []).map((kw, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 text-xs font-bold text-emerald-700">
                                {kw}
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        keywords: (prev.keywords || []).filter((_, idx) => idx !== i)
                                    }))}
                                    className="text-emerald-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Escribe y pulsa Enter..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const value = e.currentTarget.value.trim();
                                if (value && !(formData.keywords || []).includes(value)) {
                                    setFormData(prev => ({
                                        ...prev,
                                        keywords: [...(prev.keywords || []), value]
                                    }));
                                    e.currentTarget.value = "";
                                }
                            }
                        }}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Pulsa Enter para añadir. Se usarán para vincular transacciones automáticamente.</p>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar Activo"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
