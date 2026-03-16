"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IAsset } from "@/types";

interface EditAssetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset: IAsset;
}

export function EditAssetForm({ isOpen, onClose, onSuccess, asset }: EditAssetFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<IAsset>>({
        type: asset.type || "real_estate",
        name: asset.name || "",
        purchasePrice: asset.purchasePrice || 0,
        value: asset.value || 0,
        location: asset.location || "",
        rentalYield: asset.rentalYield || 0,
        mrr: asset.mrr || 0,
        area: asset.area || 0,
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: asset.type || "real_estate",
                name: asset.name || "",
                purchasePrice: asset.purchasePrice || 0,
                value: asset.value || 0,
                location: asset.location || "",
                rentalYield: asset.rentalYield || 0,
                mrr: asset.mrr || 0,
                area: asset.area || 0,
            });
        }
    }, [isOpen, asset]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/assets/${asset._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Activo">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                    label="Nombre"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Ej. Piso en Madrid"
                    required
                />
                
                <FormField
                    label="Valor Actual (€)"
                    name="value"
                    type="number"
                    value={formData.value || ""}
                    onChange={handleChange}
                    required
                />

                <FormField
                    label="Valor de Compra (€)"
                    name="purchasePrice"
                    type="number"
                    value={formData.purchasePrice || ""}
                    onChange={handleChange}
                    required
                />

                <FormField
                    label="Ubicación (opcional)"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    placeholder="Ej. Madrid, España"
                />

                {formData.type === "real_estate" && (
                    <>
                        <FormField
                            label="Área (m²) (opcional)"
                            name="area"
                            type="number"
                            value={formData.area || ""}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Rentabilidad Anual (%)"
                            name="rentalYield"
                            type="number"
                            step="0.1"
                            value={formData.rentalYield || ""}
                            onChange={handleChange}
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
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
