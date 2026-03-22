"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ImagePlus, Trash2 } from "lucide-react";
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
    image: "",
    area: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    hasElevator: false,
    hasParking: false,
    yearBuilt: undefined,
    cadastralReference: "",
    notes: "",
    keywords: [],
};

export function AddAssetForm({ isOpen, onClose, onSuccess }: AddAssetFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<IAsset>>(INITIAL_STATE);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

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
                
                {isRealEstate ? (
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
                ) : (
                    <FormField
                        label="Fecha de Inicio"
                        name="purchaseDate"
                        type="date"
                        value={formData.purchaseDate || ""}
                        onChange={handleChange}
                    />
                )}

                <FormField
                    label="Ubicación"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    placeholder="Ej. Calle Mayor 5, Madrid"
                />

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Imagen de Portada</label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    {formData.image ? (
                        <div className="relative rounded-xl overflow-hidden h-36 bg-slate-100">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => { setFormData(prev => ({ ...prev, image: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-lg"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            <ImagePlus size={20} />
                            <span className="text-xs font-medium">Haz clic para subir una imagen</span>
                        </button>
                    )}
                </div>

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

                    </>
                )}

                <FormField
                    label="Notas (opcional)"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    placeholder="Ej. Notas sobre el activo..."
                />

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
