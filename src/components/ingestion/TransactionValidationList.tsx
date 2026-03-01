"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldAlert, Building2, Hammer } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IAsset, IProject } from "@/types";

interface TransactionData {
    date: string;
    description: string;
    amount: number;
    category: string;
    linkedAssetId?: string;
    linkedProjectId?: string;
}

interface Props {
    initialData: { transactions: TransactionData[] };
    onValidate: (validatedData: TransactionData[]) => void;
    onCancel: () => void;
}

export function TransactionValidationList({ initialData, onValidate, onCancel }: Props) {
    const [transactions, setTransactions] = useState<TransactionData[]>(initialData.transactions || []);
    const { data: assets } = useApi<IAsset[]>("/api/assets");
    const { data: projects } = useApi<IProject[]>("/api/projects");

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
    };

    const handleTxChange = (index: number, field: keyof TransactionData, value: string) => {
        const newTxs = [...transactions];
        newTxs[index] = { ...newTxs[index], [field]: value };
        setTransactions(newTxs);
    };

    const handleSubmit = () => {
        onValidate(transactions.filter(tx => tx.amount !== 0)); // Filter out potential empty rows if any
    };

    return (
        <PremiumCard className="animate-in fade-in zoom-in-95 duration-300 glass border-emerald-100 ring-2 ring-emerald-50 w-full overflow-hidden !p-0">
            <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Movimientos Detectados</h2>
                        <p className="text-sm text-slate-500 font-medium">
                            La IA ha encontrado {transactions.length} registros. Revísalos, categorízalos y vincúlalos a tus activos si procede.
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10 shadow-sm shadow-slate-200/50">
                        <tr>
                            <th className="px-5 py-3 border-b border-slate-200 w-24">Fecha</th>
                            <th className="px-5 py-3 border-b border-slate-200 min-w-[200px]">Concepto</th>
                            <th className="px-5 py-3 border-b border-slate-200 w-32 text-right">Importe</th>
                            <th className="px-5 py-3 border-b border-slate-200 min-w-[150px]">Categoría (IA)</th>
                            <th className="px-5 py-3 border-b border-slate-200 min-w-[150px]">Vincular Activo/Proyecto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {transactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3 text-slate-500 font-medium font-mono text-xs">{tx.date}</td>
                                <td className="px-5 py-3">
                                    <input
                                        type="text"
                                        value={tx.description}
                                        onChange={(e) => handleTxChange(idx, 'description', e.target.value)}
                                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0 p-1 font-bold text-slate-900 transition-colors"
                                    />
                                </td>
                                <td className={`px-5 py-3 text-right font-mono font-bold ${tx.amount < 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                    {formatCurrency(tx.amount)}
                                </td>
                                <td className="px-5 py-3">
                                    <input
                                        type="text"
                                        value={tx.category}
                                        onChange={(e) => handleTxChange(idx, 'category', e.target.value)}
                                        className="w-full bg-slate-100 border-none rounded-md px-2 py-1.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </td>
                                <td className="px-5 py-3">
                                    <select
                                        value={tx.linkedAssetId || tx.linkedProjectId || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) {
                                                handleTxChange(idx, 'linkedAssetId', '');
                                                handleTxChange(idx, 'linkedProjectId', '');
                                            } else if (val.startsWith('asset_')) {
                                                handleTxChange(idx, 'linkedAssetId', val.replace('asset_', ''));
                                                handleTxChange(idx, 'linkedProjectId', '');
                                            } else {
                                                handleTxChange(idx, 'linkedProjectId', val.replace('proj_', ''));
                                                handleTxChange(idx, 'linkedAssetId', '');
                                            }
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">-- Suelto --</option>
                                        <optgroup label="🏠 Activos">
                                            {assets?.map(a => <option key={a._id} value={`asset_${a._id}`}>{a.name}</option>)}
                                        </optgroup>
                                        <optgroup label="🔨 Proyectos">
                                            {projects?.map(p => <option key={p._id} value={`proj_${p._id}`}>{p.name}</option>)}
                                        </optgroup>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100 mb-6">
                    <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs font-medium text-amber-800">
                        Los movimientos confirmados se volcarán directamente en tu Posición Global.
                        Asegúrate de vincular los ingresos o gastos correspondientes a tus Activos/Proyectos para llevar el control P&L.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        Descartar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="btn-accent px-8 py-2.5 shadow-lg shadow-emerald-500/20"
                    >
                        Confirmar ({transactions.length}) e Importar
                    </button>
                </div>
            </div>
        </PremiumCard>
    );
}
