"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IProject } from "@/types";

interface AddProjectFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddProjectForm({ isOpen, onClose, onSuccess }: AddProjectFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<IProject>>({
        name: "",
        description: "",
        budget: 0,
        actualSpent: 0,
        progress: 0,
        capitalize: true,
        estimatedEnd: "",
        expenses: [],
        notes: [],
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: "",
                description: "",
                budget: 0,
                actualSpent: 0,
                progress: 0,
                capitalize: true,
                estimatedEnd: "",
                expenses: [],
                notes: [],
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
            const res = await fetch("/api/projects", {
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
        <Modal isOpen={isOpen} onClose={onClose} title="Añadir Nuevo Proyecto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                    label="Nombre del Proyecto"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Ej. Reforma Baño"
                    required
                />
                
                <FormField
                    label="Descripción"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Breve descripción del proyecto"
                />
                
                <FormField
                    label="Presupuesto (€)"
                    name="budget"
                    type="number"
                    value={formData.budget || ""}
                    onChange={handleChange}
                    required
                />

                <FormField
                    label="Fecha Estimada de Fin"
                    name="estimatedEnd"
                    type="date"
                    value={formData.estimatedEnd || ""}
                    onChange={handleChange}
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
                        {loading ? "Guardando..." : "Guardar Proyecto"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
