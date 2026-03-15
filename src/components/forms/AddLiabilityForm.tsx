"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { ILiability } from "@/types";
import { FileUp, Sparkles, Loader2 } from "lucide-react";

interface AddLiabilityFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddLiabilityForm({ isOpen, onClose, onSuccess }: AddLiabilityFormProps) {
    const [loading, setLoading] = useState(false);
    const [analyzingDoc, setAnalyzingDoc] = useState(false);
    const [formData, setFormData] = useState<Partial<ILiability>>({
        type: "loan",
        name: "",
        bank: "",
        balance: 0,
        interestRate: 0,
        monthlyPayment: 0,
        loanNumber: "",
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: "loan",
                name: "",
                bank: "",
                balance: 0,
                interestRate: 0,
                monthlyPayment: 0,
                loanNumber: "",
            });
        }
    }, [isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAnalyzingDoc(true);
        const data = new FormData();
        data.append("file", file);
        data.append("type", "loan");

        try {
            const res = await fetch("/api/ingestion/analyze", {
                method: "POST",
                body: data,
            });

            if (!res.ok) throw new Error("Failed to analyze document");

            const result = await res.json();
            
            // Auto-fill form data with AI results
            setFormData(prev => ({
                ...prev,
                bank: result.bank || prev.bank,
                type: result.type || prev.type,
                balance: result.balance || prev.balance,
                interestRate: result.interestRate || prev.interestRate,
                monthlyPayment: result.monthlyPayment || prev.monthlyPayment,
                loanNumber: result.loanNumber || prev.loanNumber
            }));
            
        } catch (error) {
            console.error(error);
            alert("Error al analizar el documento con IA.");
        } finally {
            setAnalyzingDoc(false);
            // Reset the file input
            e.target.value = '';
        }
    };

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
            const res = await fetch("/api/liabilities", {
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
        <Modal isOpen={isOpen} onClose={onClose} title="Añadir Préstamo / Hipoteca">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* AI Document Upload Section */}
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all hover:border-accent/50 hover:bg-slate-100/50">
                    <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        disabled={analyzingDoc || loading}
                    />
                    {analyzingDoc ? (
                        <div className="flex flex-col items-center text-accent animate-pulse">
                            <Loader2 size={24} className="animate-spin mb-2" />
                            <p className="text-sm font-bold">La IA está extrayendo los datos...</p>
                            <p className="text-xs font-medium text-slate-500 mt-1">Esto puede tardar unos segundos</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-slate-500">
                            <div className="h-10 w-10 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center mb-3 text-accent">
                                <Sparkles size={18} />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Autorrellenar con IA</p>
                            <p className="text-xs font-medium mt-1">Sube el PDF del contrato o recibo del préstamo para rellenar los datos automáticamente.</p>
                        </div>
                    )}
                </div>

                <div className="h-px w-full bg-slate-100 my-2"></div>
                <FormField
                    label="Tipo"
                    name="type"
                    type="select"
                    value={formData.type}
                    onChange={handleChange}
                    options={[
                        { label: "Préstamo Personal", value: "loan" },
                        { label: "Hipoteca", value: "mortgage" },
                    ]}
                    required
                />
                
                <FormField
                    label="Nombre"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Ej. Hipoteca Casa Madrid"
                    required
                />
                
                <FormField
                    label="Banco / Entidad"
                    name="bank"
                    value={formData.bank || ""}
                    onChange={handleChange}
                    placeholder="Ej. Santander"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Saldo Pendiente (€)"
                        name="balance"
                        type="number"
                        value={formData.balance || ""}
                        onChange={handleChange}
                        required
                    />
                    
                    <FormField
                        label="Cuota Mensual (€)"
                        name="monthlyPayment"
                        type="number"
                        value={formData.monthlyPayment || ""}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="TIN / Tipo Interés (%)"
                        name="interestRate"
                        type="number"
                        step="0.01"
                        value={formData.interestRate || ""}
                        onChange={handleChange}
                        required
                    />
                    
                    <FormField
                        label="Número de Préstamo (opcional)"
                        name="loanNumber"
                        value={formData.loanNumber || ""}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={loading || analyzingDoc}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                        disabled={loading || analyzingDoc}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin"/> : null}
                        {loading ? "Guardando..." : "Guardar Préstamo"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
