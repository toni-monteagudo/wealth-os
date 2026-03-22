"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IAsset, IProject, IIngestionBatch } from "@/types";

const PAGE_SIZE = 20;

export default function BatchDetailClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const batchId = searchParams.get("batchId");
    const pageParam = parseInt(searchParams.get("page") || "1", 10);

    const { data: batch, loading } = useApi<IIngestionBatch>(
        batchId ? `/api/ingestion/batches/${batchId}` : ""
    );
    const { data: assets } = useApi<IAsset[]>("/api/assets");
    const { data: projects } = useApi<IProject[]>("/api/projects");

    const totalPages = batch ? Math.ceil(batch.totalCount / PAGE_SIZE) : 0;
    const pageTransactions = batch
        ? batch.transactions.slice((pageParam - 1) * PAGE_SIZE, pageParam * PAGE_SIZE)
        : [];

    const formatCurrency = (num: number) =>
        new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);

    const resolveLinked = (assetId?: string, projectId?: string): string => {
        if (assetId) {
            const asset = assets?.find(a => a._id === assetId);
            return asset ? asset.name : "—";
        }
        if (projectId) {
            const project = projects?.find(p => p._id === projectId);
            return project ? project.name : "—";
        }
        return "—";
    };

    if (!batchId) {
        return (
            <PremiumCard className="text-center py-12">
                <p className="text-slate-500 font-medium">No se ha encontrado el lote de importación.</p>
                <button onClick={() => router.push("/global-position")} className="mt-4 text-sm font-bold text-emerald-600 hover:underline">
                    Volver a Posición Global
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
                <button onClick={() => router.push("/global-position")} className="mt-4 text-sm font-bold text-emerald-600 hover:underline">
                    Volver a Posición Global
                </button>
            </PremiumCard>
        );
    }

    const formattedDate = batch.createdAt
        ? new Date(batch.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "";

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.push("/global-position")}
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 mb-2"
                >
                    <ArrowLeft size={14} /> Volver a Posición Global
                </button>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Detalle de Importación
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                    {batch.fileName || "Extracto"} — {batch.totalCount} transacciones — {formattedDate}
                </p>
            </div>

            {/* Transaction table */}
            <PremiumCard className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10 shadow-sm shadow-slate-200/50">
                            <tr>
                                <th className="px-5 py-3 border-b border-slate-200 w-24">Fecha</th>
                                <th className="px-5 py-3 border-b border-slate-200 min-w-[200px]">Concepto</th>
                                <th className="px-5 py-3 border-b border-slate-200 min-w-[160px]">Desc. amigable</th>
                                <th className="px-5 py-3 border-b border-slate-200 w-32 text-right">Importe</th>
                                <th className="px-5 py-3 border-b border-slate-200 min-w-[130px]">Categoría</th>
                                <th className="px-5 py-3 border-b border-slate-200 min-w-[130px]">Vinculado a</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {pageTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400 font-medium">
                                        No hay transacciones en esta página.
                                    </td>
                                </tr>
                            ) : (
                                pageTransactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3 text-slate-500 font-medium font-mono text-xs">{tx.date}</td>
                                        <td className="px-5 py-3 font-bold text-slate-900">{tx.description}</td>
                                        <td className="px-5 py-3 text-sm text-indigo-700">{tx.friendlyDescription || "—"}</td>
                                        <td className="px-5 py-3 text-right font-mono font-bold">
                                            <span className={tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}>
                                                {formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-block rounded-md px-2 py-1 text-[11px] font-bold uppercase ${
                                                tx.category !== "OTROS"
                                                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                                    : "text-slate-600 bg-slate-100 border border-slate-200"
                                            }`}>
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs font-medium text-slate-600">
                                            {resolveLinked(tx.linkedAssetId, tx.linkedProjectId)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with pagination */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-slate-500">
                            Mostrando {pageTransactions.length} de {batch.totalCount} transacciones
                            {totalPages > 1 && ` — Página ${pageParam} de ${totalPages}`}
                        </div>
                        <div className="flex items-center gap-3">
                            {pageParam > 1 && (
                                <button
                                    onClick={() => router.push(`/global-position/detail?batchId=${batchId}&page=${pageParam - 1}`)}
                                    className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                >
                                    <ChevronLeft size={16} /> Anterior
                                </button>
                            )}
                            {pageParam < totalPages && (
                                <button
                                    onClick={() => router.push(`/global-position/detail?batchId=${batchId}&page=${pageParam + 1}`)}
                                    className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                >
                                    Siguiente <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </PremiumCard>
        </div>
    );
}
