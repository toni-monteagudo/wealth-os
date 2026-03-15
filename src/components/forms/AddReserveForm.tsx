"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IReserve } from "@/types";

interface AddReserveFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddReserveForm({ isOpen, onClose, onSuccess }: AddReserveFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<IReserve>>({
        name: "",
        type: "custom",
        balance: 0,
        target: 0,
        dueDate: "",
        allocationPercent: 0,
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: "",
                type: "custom",
                balance: 0,
                target: 0,
                dueDate: "",
                allocationPercent: 0,
            });
        }
    }, [isOpen]);

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
            const res = await fetch("/api/reserves", {
                method: "POST",
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
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Reserva Fantasma">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                    label="Nombre de la Reserva"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Ej. IBI 2026, Fondo Emergencia"
                    required
                />
                
                <FormField
                    label="Tipo de Reserva"
                    name="type"
                    type="select"
                    value={formData.type}
                    onChange={handleChange}
                    options={[
                        { label: "Impuestos", value: "tax" },
                        { label: "Mantenimiento", value: "maintenance" },
                        { label: "Emergencia", value: "emergency" },
                        { label: "Personalizado", value: "custom" },
                    ]}
                    required
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Balance Inicial (€)"
                        name="balance"
                        type="number"
                        value={formData.balance || ""}
                        onChange={handleChange}
                        required
                    />
                    
                    <FormField
                        label="Objetivo (Target €)"
                        name="target"
                        type="number"
                        value={formData.target || ""}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Fecha de Vencimiento"
                        name="dueDate"
                        type="date"
                        value={formData.dueDate || ""}
                        onChange={handleChange}
                    />
                    
                    <FormField
                        label="Asignación Automática (%)"
                        name="allocationPercent"
                        type="number"
                        value={formData.allocationPercent || ""}
                        onChange={handleChange}
                    />
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
                        {loading ? "Guardando..." : "Crear Reserva"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
