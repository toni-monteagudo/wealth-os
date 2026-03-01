"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldAlert, Building2 } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IAsset } from "@/types";

interface LoanData {
    bank: string;
    type: "mortgage" | "personal";
    balance: number;
    interestRate: number;
    monthlyPayment: number;
    loanNumber?: string;
}

interface Props {
    initialData: LoanData;
    onValidate: (validatedData: any) => void;
    onCancel: () => void;
}

export function LoanValidationForm({ initialData, onValidate, onCancel }: Props) {
    const [formData, setFormData] = useState<LoanData>(initialData);
    const [linkedAssetId, setLinkedAssetId] = useState<string>("");

    // Fetch assets so the user can link the loan to a property/business
    const { data: assets } = useApi<IAsset[]>("/api/assets");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'balance' || name === 'interestRate' || name === 'monthlyPayment' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onValidate({
            ...formData,
            linkedAssetId: linkedAssetId || undefined
        });
    };

    return (
        <PremiumCard className="animate-in fade-in zoom-in-95 duration-300 glass border-emerald-100 ring-2 ring-emerald-50 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 border-b border-emerald-100/50 pb-4">
                <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Lectura Inteligente Completada</h2>
                    <p className="text-sm text-slate-500 font-medium">Revisa los datos extraídos antes de guardarlos en tu Bóveda.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Entidad / Banco</label>
                        <input
                            type="text"
                            name="bank"
                            value={formData.bank}
                            onChange={handleChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Préstamo</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                            <option value="mortgage">Hipoteca</option>
                            <option value="personal">Préstamo Personal</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Capital Pendiente (€)</label>
                        <input
                            type="number"
                            name="balance"
                            value={formData.balance}
                            onChange={handleChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            required
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Interés (%)</label>
                        <input
                            type="number"
                            name="interestRate"
                            value={formData.interestRate}
                            onChange={handleChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            required
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cuota Mensual (€)</label>
                        <input
                            type="number"
                            name="monthlyPayment"
                            value={formData.monthlyPayment}
                            onChange={handleChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            required
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Building2 size={14} /> Activo Vinculado (Opcional)
                        </label>
                        <select
                            value={linkedAssetId}
                            onChange={e => setLinkedAssetId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="">-- Sin Vincular --</option>
                            {assets?.map(a => (
                                <option key={a._id} value={a._id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100">
                    <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs font-medium text-amber-800">
                        La IA se puede equivocar. Por favor, asegúrate de que el Capital Pendiente y la Cuota son correctos antes de confirmar, ya que esto afectará a tu flujo de caja proyectado.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Descartar
                    </button>
                    <button
                        type="submit"
                        className="btn-accent px-8 py-2.5 shadow-lg shadow-emerald-500/20"
                    >
                        Confirmar y Guardar
                    </button>
                </div>
            </form>
        </PremiumCard>
    );
}
