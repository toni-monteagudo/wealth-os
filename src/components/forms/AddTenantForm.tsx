"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Tenant } from "@/types";

interface AddTenantFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assetId: string;
    initialData?: Tenant;
}

const EMPTY_TENANT: Partial<Tenant> = {
    name: "",
    phone: "",
    email: "",
    contractStart: "",
    contractEnd: "",
    monthlyRent: 0,
    deposit: 0,
    notes: "",
};

export function AddTenantForm({ isOpen, onClose, onSuccess, assetId, initialData }: AddTenantFormProps) {
    const [loading, setLoading] = useState(false);
    const isEditMode = !!initialData;
    const [formData, setFormData] = useState<Partial<Tenant>>(EMPTY_TENANT);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                let fmtStart = initialData.contractStart || "";
                if (fmtStart.includes("T")) fmtStart = fmtStart.split("T")[0];
                let fmtEnd = initialData.contractEnd || "";
                if (fmtEnd.includes("T")) fmtEnd = fmtEnd.split("T")[0];
                setFormData({ ...initialData, contractStart: fmtStart, contractEnd: fmtEnd });
            } else {
                setFormData(EMPTY_TENANT);
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
            if (isEditMode) {
                const res = await fetch(`/api/assets/${assetId}/tenants`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tenantId: initialData._id, ...formData }),
                });
                if (res.ok) { onSuccess(); onClose(); }
            } else {
                const res = await fetch(`/api/assets/${assetId}/tenants`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                if (res.ok) { onSuccess(); onClose(); }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Editar Inquilino" : "Añadir Inquilino"}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                    label="Nombre Completo"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Ej. Juan García López"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Teléfono"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        placeholder="612 345 678"
                    />
                    <FormField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="inquilino@email.com"
                    />
                </div>

                <div className="h-px w-full bg-slate-100 my-1"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contrato</p>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Fecha de Entrada"
                        name="contractStart"
                        type="date"
                        value={formData.contractStart || ""}
                        onChange={handleChange}
                        required
                    />
                    <FormField
                        label="Fecha de Salida"
                        name="contractEnd"
                        type="date"
                        value={formData.contractEnd || ""}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Renta Mensual (€)"
                        name="monthlyRent"
                        type="number"
                        step="0.01"
                        value={formData.monthlyRent || ""}
                        onChange={handleChange}
                        required
                    />
                    <FormField
                        label="Fianza (€)"
                        name="deposit"
                        type="number"
                        step="0.01"
                        value={formData.deposit || ""}
                        onChange={handleChange}
                    />
                </div>

                <FormField
                    label="Notas (opcional)"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    placeholder="Ej. Pago por transferencia el día 1 de cada mes..."
                />

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
                        {loading ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Añadir Inquilino")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
