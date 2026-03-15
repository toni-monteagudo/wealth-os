"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IDocument } from "@/types";

interface AddDocumentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddDocumentForm({ isOpen, onClose, onSuccess }: AddDocumentFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<IDocument>>({
        name: "",
        type: "property",
        entity: "",
        fileType: "PDF",
        status: "active",
        uploadDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: "",
                type: "property",
                entity: "",
                fileType: "PDF",
                status: "active",
                uploadDate: new Date().toISOString().split('T')[0],
            });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/documents", {
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
        <Modal isOpen={isOpen} onClose={onClose} title="Subir Documento">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                    label="Nombre del Documento"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Ej. Escritura Casa"
                    required
                />
                
                <FormField
                    label="Tipo de Documento"
                    name="type"
                    type="select"
                    value={formData.type}
                    onChange={handleChange}
                    options={[
                        { label: "Propiedad", value: "property" },
                        { label: "Legal", value: "legal" },
                        { label: "Seguro", value: "insurance" },
                    ]}
                    required
                />
                
                <FormField
                    label="Entidad / Relación"
                    name="entity"
                    value={formData.entity || ""}
                    onChange={handleChange}
                    placeholder="Ej. Casa Madrid, Coche..."
                    required
                />

                <FormField
                    label="Fecha de Vencimiento (opcional)"
                    name="expirationDate"
                    type="date"
                    value={formData.expirationDate || ""}
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
                        {loading ? "Guardando..." : "Subir Documento"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
