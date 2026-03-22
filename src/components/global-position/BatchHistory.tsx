"use client";

import React, { useState } from "react";
import { Package, Eye, Trash2, Loader2 } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { IIngestionBatch } from "@/types";

interface BatchHistoryProps {
    batches: IIngestionBatch[];
    onDelete: (batchId: string) => Promise<void>;
    onPurge: () => Promise<void>;
    onView: (batchId: string) => void;
    deletingBatchId: string | null;
}

export function BatchHistory({ batches, onDelete, onPurge, onView, deletingBatchId }: BatchHistoryProps) {
    const [expanded, setExpanded] = useState(false);
    const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

    const completedBatches = batches?.filter(b => b.status === "completed") || [];

    const formatDate = (dateStr: string | Date | undefined) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatShortDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" });
        } catch { return dateStr; }
    };

    const getBatchDateRange = (batch: IIngestionBatch) => {
        if (!batch.transactions?.length) return null;
        const dates = batch.transactions.map(t => t.date).filter(Boolean).sort();
        if (dates.length === 0) return null;
        return { from: dates[0], to: dates[dates.length - 1] };
    };

    const handlePurge = async () => {
        await onPurge();
        setIsPurgeModalOpen(false);
    };

    return (
        <>
            <PremiumCard>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between"
                >
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <Package size={12} className="inline mr-1" /> Historial de Importaciones ({completedBatches.length})
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">{expanded ? "Ocultar" : "Mostrar"}</span>
                </button>

                {expanded && (
                    <div className="mt-4">
                        {completedBatches.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">Sin importaciones completadas.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {completedBatches.map(batch => {
                                    const dateRange = getBatchDateRange(batch);
                                    return (
                                        <div key={batch._id} className="group flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2.5 transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{batch.fileName || "Extracto"}</p>
                                                <p className="text-[10px] text-slate-400">{formatDate(batch.createdAt)} — {batch.totalCount} txs</p>
                                                {dateRange && (
                                                    <p className="text-[10px] text-slate-400">
                                                        {formatShortDate(dateRange.from)} → {formatShortDate(dateRange.to)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onView(batch._id!)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(batch._id!)}
                                                    disabled={deletingBatchId === batch._id}
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                                                    title="Eliminar lote y transacciones"
                                                >
                                                    {deletingBatchId === batch._id
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <Trash2 size={14} />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {completedBatches.length > 0 && (
                            <button
                                onClick={() => setIsPurgeModalOpen(true)}
                                className="mt-3 w-full text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 py-2 rounded-lg border border-transparent hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={12} /> Eliminar todo
                            </button>
                        )}
                    </div>
                )}
            </PremiumCard>

            <ConfirmDeleteModal
                isOpen={isPurgeModalOpen}
                onClose={() => setIsPurgeModalOpen(false)}
                onConfirm={handlePurge}
                itemName="todas las transacciones"
                itemType="historial completo de"
                description="Esta acción borrará permanentemente todas las transacciones importadas y todo el historial de importaciones. No se puede deshacer."
            />
        </>
    );
}
