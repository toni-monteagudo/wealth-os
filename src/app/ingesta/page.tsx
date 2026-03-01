"use client";

import React, { useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, SplitSquareHorizontal } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { ITransaction } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function IngestionPage() {
    const { data: txs, loading, mutate } = useApi<ITransaction[]>("/api/transactions");
    const { t } = useI18n();
    const [isUploading, setIsUploading] = useState(false);

    const needsReviewCount = txs?.filter(t => t.status === "needs_review").length || 0;
    const confirmedCount = txs?.filter(t => t.status === "confirmed").length || 0;
    const total = txs?.length || 0;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/transactions/ingest", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                mutate();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const confirmTx = async (id: string) => {
        await fetch(`/api/transactions/${id}/confirm`, { method: "PUT" });
        mutate();
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
    };

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <UploadCloud size={32} className="text-accent" /> {t("ingestion.hub_title")}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">Sube extractos bancarios. La IA categorizará y detectará reglas de separación.</p>
                </div>

                <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                    <FileSpreadsheet size={18} /> Subir CSV/XLS
                    <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={handleFileUpload} />
                </label>
            </div>

            {isUploading && (
                <PremiumCard className="bg-emerald-50 border-emerald-100 flex items-center gap-4">
                    <div className="animate-spin size-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full"></div>
                    <div>
                        <p className="font-bold text-emerald-800">{t("ingestion.analyzing_statements")}</p>
                        <p className="text-sm text-emerald-600">Aplicando reglas NLP y heurísticas de categorización...</p>
                    </div>
                </PremiumCard>
            )}

            {/* Grid: Stats & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Col: Summary Stats */}
                <div className="flex flex-col gap-4">
                    <PremiumCard>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{t("ingestion.processing_summary")}</h3>

                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-1">
                                <p className="text-3xl font-bold text-slate-900">{total}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("ingestion.identified")}</p>
                            </div>
                            <ProgressBar progress={100} colorClass="bg-slate-200" />
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-1">
                                <p className="text-3xl font-bold text-amber-500">{needsReviewCount}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("ingestion.needs_review")}</p>
                            </div>
                            <ProgressBar progress={(needsReviewCount / total) * 100} colorClass="bg-amber-500" />
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <p className="text-3xl font-bold text-emerald-500">{confirmedCount}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmadas</p>
                            </div>
                            <ProgressBar progress={(confirmedCount / total) * 100} colorClass="bg-emerald-500" />
                        </div>
                    </PremiumCard>
                </div>

                {/* Right Col: Timeline & Feed */}
                <div className="lg:col-span-3">
                    <PremiumCard className="!p-0 h-full flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">{t("ingestion.timeline")}</h3>
                            <div className="flex gap-2">
                                <button className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm">
                                    {t("ingestion.filter")}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto max-h-[600px] p-0">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">{t("ingestion.date")}</th>
                                        <th className="px-6 py-3">{t("ingestion.description")}</th>
                                        <th className="px-6 py-3">{t("ingestion.category_tags")}</th>
                                        <th className="px-6 py-3 text-right">{t("ingestion.amount")}</th>
                                        <th className="px-6 py-3 text-center">{t("ingestion.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-slate-400 font-medium">Cargando...</td></tr>
                                    ) : txs?.map((tx: ITransaction) => (
                                        <tr key={tx._id} className={`hover:bg-slate-50/50 transition-colors ${tx.status === 'needs_review' ? 'bg-amber-50/10' : ''}`}>
                                            <td className="px-6 py-4 text-slate-500 font-medium">{tx.date}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                {tx.description}
                                                {tx.status === 'needs_review' && <span className="ml-2 inline-flex items-center text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-bold uppercase"><AlertCircle size={10} className="mr-0.5" /> REVISAR</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="neutral">{tx.category}</Badge>
                                                    {tx.tags?.map((t: string) => <Badge key={t} variant="info">{t}</Badge>)}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono font-bold ${tx.amount < 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                                {formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {tx.status === 'needs_review' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => confirmTx(tx._id!)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded border border-transparent hover:border-emerald-200 transition-colors"
                                                            title="Confirmar"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-200 transition-colors"
                                                            title="Dividir (Split)"
                                                        >
                                                            <SplitSquareHorizontal size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <CheckCircle2 size={18} className="text-emerald-300 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                            <button className="text-xs font-bold text-slate-500 hover:text-slate-900">{t("ingestion.load_more")}</button>
                        </div>
                    </PremiumCard>
                </div>

            </div>
        </main>
    );
}
