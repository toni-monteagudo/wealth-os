"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, ArrowLeft, Sparkles, Loader2, Plus, X } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useApi } from "@/hooks/useApi";
import { IAsset, IProject, IIngestionBatch, IStagedTransaction, ICategory } from "@/types";
import { useI18n } from "@/i18n/I18nContext";

const PAGE_SIZE = 20;

interface CorrectionEntry {
    category?: string;
    linkedAssetId?: string;
    linkedProjectId?: string;
}

function normalizeDescription(desc: string): string {
    return desc.toLowerCase().trim().replace(/\s+/g, " ");
}

export default function ReviewClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useI18n();

    const batchId = searchParams.get("batchId");
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const pageIndex = pageParam - 1;

    const { data: batch, loading, mutate } = useApi<IIngestionBatch>(
        batchId ? `/api/ingestion/batches/${batchId}` : ""
    );
    const { data: assets } = useApi<IAsset[]>("/api/assets");
    const { data: projects } = useApi<IProject[]>("/api/projects");
    const { data: categories, mutate: mutateCategories } = useApi<ICategory[]>("/api/categories");

    const [corrections, setCorrections] = useState<Record<string, CorrectionEntry>>({});
    const [pageTransactions, setPageTransactions] = useState<IStagedTransaction[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

    const totalPages = batch ? Math.ceil(batch.totalCount / PAGE_SIZE) : 0;
    const isLastPage = pageParam >= totalPages;

    // Category names list for the select
    const categoryNames = categories?.map(c => c.name) || [];

    // Pending AI suggestions (not yet accepted or dismissed)
    const pendingSuggestions = (batch?.suggestedCategories || []).filter(
        s => !acceptedSuggestions.has(s) && !dismissedSuggestions.has(s) && !categoryNames.includes(s)
    );

    useEffect(() => {
        if (!batch?.transactions) return;

        const start = pageIndex * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const slice = batch.transactions.slice(start, end).map(tx => {
            const key = normalizeDescription(tx.description);
            const correction = corrections[key];
            if (correction && !tx.confirmed) {
                return {
                    ...tx,
                    category: correction.category || tx.category,
                    linkedAssetId: correction.linkedAssetId ?? tx.linkedAssetId,
                    linkedProjectId: correction.linkedProjectId ?? tx.linkedProjectId,
                };
            }
            return { ...tx };
        });

        setPageTransactions(slice);
    }, [batch, pageIndex, corrections]);

    const handleTxChange = useCallback((index: number, field: keyof IStagedTransaction, value: string) => {
        setPageTransactions(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            const key = normalizeDescription(updated[index].description);
            setCorrections(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    ...(field === "category" ? { category: value } : {}),
                    ...(field === "linkedAssetId" ? { linkedAssetId: value } : {}),
                    ...(field === "linkedProjectId" ? { linkedProjectId: value } : {}),
                },
            }));

            if (field === "category" || field === "linkedAssetId" || field === "linkedProjectId") {
                for (let i = 0; i < updated.length; i++) {
                    if (i !== index && normalizeDescription(updated[i].description) === key) {
                        updated[i] = { ...updated[i], [field]: value };
                    }
                }
            }

            return updated;
        });
    }, []);

    const handleAcceptSuggestion = async (name: string) => {
        try {
            await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            setAcceptedSuggestions(prev => new Set(prev).add(name));
            mutateCategories();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDismissSuggestion = (name: string) => {
        setDismissedSuggestions(prev => new Set(prev).add(name));
    };

    const handleConfirmPage = async () => {
        if (!batchId) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/ingestion/batches/${batchId}/confirm`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageIndex,
                    pageSize: PAGE_SIZE,
                    transactions: pageTransactions,
                }),
            });

            if (!res.ok) throw new Error("Failed to confirm");

            const result = await res.json();

            if (isLastPage || result.status === "completed") {
                router.push("/ingestion");
            } else {
                await mutate();
                router.push(`/ingestion/review?batchId=${batchId}&page=${pageParam + 1}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error al guardar las transacciones.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = async () => {
        if (!batchId || !confirm("¿Descartar toda la importación?")) return;

        await fetch(`/api/ingestion/batches/${batchId}`, { method: "DELETE" });
        router.push("/ingestion");
    };

    const formatCurrency = (num: number) =>
        new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);

    if (!batchId) {
        return (
            <PremiumCard className="text-center py-12">
                <p className="text-slate-500 font-medium">No se ha encontrado el lote de importación.</p>
                <button onClick={() => router.push("/ingestion")} className="mt-4 text-sm font-bold text-emerald-600 hover:underline">
                    Volver a Ingesta
                </button>
            </PremiumCard>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="animate-spin" size={24} />
                <span className="font-medium">Cargando lote...</span>
            </div>
        );
    }

    if (!batch) {
        return (
            <PremiumCard className="text-center py-12">
                <p className="text-slate-500 font-medium">Lote no encontrado o expirado.</p>
                <button onClick={() => router.push("/ingestion")} className="mt-4 text-sm font-bold text-emerald-600 hover:underline">
                    Volver a Ingesta
                </button>
            </PremiumCard>
        );
    }

    const confirmedOnPreviousPages = batch.confirmedCount;
    const overallProgress = ((confirmedOnPreviousPages) / batch.totalCount) * 100;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <button
                        onClick={() => router.push("/ingestion")}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-2"
                    >
                        <ArrowLeft size={14} /> Volver a Ingesta
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {t("ingestion.review_title") !== "ingestion.review_title" ? t("ingestion.review_title") : "Revisar Importación"}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        {batch.totalCount} transacciones detectadas — Revisa la categorización y vincula a activos.
                    </p>
                </div>
                <button
                    onClick={handleDiscard}
                    className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                    Descartar lote
                </button>
            </div>

            {/* AI Suggested Categories */}
            {pendingSuggestions.length > 0 && (
                <PremiumCard className="border-indigo-100 bg-indigo-50/30 !py-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-indigo-500" />
                        <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Categorías sugeridas por la IA</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {pendingSuggestions.map(name => (
                            <div key={name} className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5">
                                <span className="text-xs font-bold text-indigo-800">{name}</span>
                                <button
                                    onClick={() => handleAcceptSuggestion(name)}
                                    className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title="Aceptar categoría"
                                >
                                    <Plus size={14} />
                                </button>
                                <button
                                    onClick={() => handleDismissSuggestion(name)}
                                    className="p-0.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                    title="Descartar"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </PremiumCard>
            )}

            {/* Progress bar */}
            <PremiumCard className="!py-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-700">
                        Página {pageParam} de {totalPages}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                        {confirmedOnPreviousPages} de {batch.totalCount} confirmadas
                    </p>
                </div>
                <ProgressBar progress={overallProgress} colorClass="bg-emerald-500" />
                <div className="flex justify-center mt-3 gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all ${
                                i + 1 === pageParam
                                    ? "w-6 bg-emerald-500"
                                    : i + 1 <= Math.ceil(confirmedOnPreviousPages / PAGE_SIZE)
                                        ? "w-2 bg-emerald-300"
                                        : "w-2 bg-slate-200"
                            }`}
                        />
                    ))}
                </div>
            </PremiumCard>

            {/* Transaction table */}
            <PremiumCard className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10 shadow-sm shadow-slate-200/50">
                            <tr>
                                <th className="px-5 py-3 border-b border-slate-200 w-24">Fecha</th>
                                <th className="px-5 py-3 border-b border-slate-200 min-w-[200px]">Concepto</th>
                                <th className="px-5 py-3 border-b border-slate-200 w-32 text-right">Importe</th>
                                <th className="px-5 py-3 border-b border-slate-200 min-w-[150px]">Categoría</th>
                                <th className="px-5 py-3 border-b border-slate-200 min-w-[150px]">Vincular Activo/Proyecto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {pageTransactions.map((tx, idx) => {
                                const corrKey = normalizeDescription(tx.description);
                                const wasCorrected = !!corrections[corrKey];

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3 text-slate-500 font-medium font-mono text-xs">{tx.date}</td>
                                        <td className="px-5 py-3">
                                            <input
                                                type="text"
                                                value={tx.description}
                                                onChange={(e) => handleTxChange(idx, "description", e.target.value)}
                                                className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:ring-0 p-1 font-bold text-slate-900 transition-colors"
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono font-bold">
                                            <span className={tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}>
                                                {formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="relative flex items-center">
                                                <select
                                                    value={tx.category}
                                                    onChange={(e) => handleTxChange(idx, "category", e.target.value)}
                                                    className={`w-full rounded-md px-2 py-1.5 text-[11px] font-bold uppercase focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer ${
                                                        tx.category !== "OTROS"
                                                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                                            : "text-slate-600 bg-slate-100 border border-slate-200"
                                                    }`}
                                                >
                                                    {categoryNames.map(name => (
                                                        <option key={name} value={name}>{name}</option>
                                                    ))}
                                                    {/* If current value is not in the list, show it anyway */}
                                                    {tx.category && !categoryNames.includes(tx.category) && (
                                                        <option value={tx.category}>{tx.category} (nueva)</option>
                                                    )}
                                                </select>
                                                {wasCorrected && (
                                                    <div className="absolute right-5 text-emerald-500 pointer-events-none" title="Auto-corregido por tu revisión">
                                                        <Sparkles size={10} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <select
                                                value={
                                                    tx.linkedAssetId ? `asset_${tx.linkedAssetId}` :
                                                    tx.linkedProjectId ? `proj_${tx.linkedProjectId}` : ""
                                                }
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!val) {
                                                        handleTxChange(idx, "linkedAssetId", "");
                                                        handleTxChange(idx, "linkedProjectId", "");
                                                    } else if (val.startsWith("asset_")) {
                                                        handleTxChange(idx, "linkedAssetId", val.replace("asset_", ""));
                                                        handleTxChange(idx, "linkedProjectId", "");
                                                    } else {
                                                        handleTxChange(idx, "linkedProjectId", val.replace("proj_", ""));
                                                        handleTxChange(idx, "linkedAssetId", "");
                                                    }
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                <option value="">-- Suelto --</option>
                                                <optgroup label="Activos">
                                                    {assets?.map(a => (
                                                        <option key={a._id} value={`asset_${a._id}`}>{a.name}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Proyectos">
                                                    {projects?.map(p => (
                                                        <option key={p._id} value={`proj_${p._id}`}>{p.name}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-slate-500">
                            Mostrando {pageTransactions.length} de {batch.totalCount} transacciones
                            {Object.keys(corrections).length > 0 && (
                                <span className="ml-2 text-emerald-600">
                                    <Sparkles size={10} className="inline mr-0.5" />
                                    {Object.keys(corrections).length} correcciones aplicadas
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {pageParam > 1 && (
                                <button
                                    onClick={() => router.push(`/ingestion/review?batchId=${batchId}&page=${pageParam - 1}`)}
                                    className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                >
                                    <ChevronLeft size={16} /> Anterior
                                </button>
                            )}
                            <button
                                onClick={handleConfirmPage}
                                disabled={isSaving}
                                className="btn-accent px-8 py-2.5 shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                {isLastPage ? "Guardar y Finalizar" : "Guardar y Continuar"}
                                {!isLastPage && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </PremiumCard>
        </div>
    );
}
