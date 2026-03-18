"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, SplitSquareHorizontal, Package, Trash2, Eye, Loader2, Tag, Plus, X } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { ITransaction, IIngestionBatch, ICategory, ITransactionStats } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoanValidationForm } from "@/components/ingestion/LoanValidationForm";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export default function IngestionPage() {
    const router = useRouter();
    const { data: txs, loading, mutate } = useApi<ITransaction[]>("/api/transactions");
    const { data: stats, mutate: mutateStats } = useApi<ITransactionStats>("/api/transactions/stats");
    const { data: batches, mutate: mutateBatches } = useApi<IIngestionBatch[]>("/api/ingestion/batches");
    const { data: categories, mutate: mutateCategories } = useApi<ICategory[]>("/api/categories");
    const { t } = useI18n();
    const [isUploading, setIsUploading] = useState(false);
    const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showCategories, setShowCategories] = useState(false);
    const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

    // AI Validation States
    const [loanDataToValidate, setLoanDataToValidate] = useState<any>(null);

    // SSE upload progress for statements
    const [uploadProgress, setUploadProgress] = useState<{
        phase: string;
        chunk?: number;
        totalChunks?: number;
        processed?: number;
        total?: number;
        parsedCount?: number;
        message?: string;
    } | null>(null);

    const needsReviewCount = stats?.needsReviewCount || 0;
    const confirmedCount = stats?.confirmedCount || 0;
    const total = stats?.total || 0;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "statement" | "loan") => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(null);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        try {
            const res = await fetch("/api/ingestion/analyze", {
                method: "POST",
                body: formData,
            });

            if (type === "loan") {
                // Loan path: simple JSON response (unchanged)
                if (res.ok) {
                    const data = await res.json();
                    setLoanDataToValidate(data);
                } else {
                    alert("Hubo un error al procesar el documento con IA.");
                }
            } else {
                // Statement path: SSE stream
                if (!res.body) {
                    alert("Hubo un error al procesar el documento.");
                    return;
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                setUploadProgress(data);

                                if (data.phase === "complete") {
                                    router.push(`/ingestion/review?batchId=${data.batchId}&page=1`);
                                    return;
                                }
                                if (data.phase === "error") {
                                    alert(data.message || "Error al analizar el documento.");
                                    return;
                                }
                            } catch {
                                // Ignore malformed SSE lines
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el motor de IA.");
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
            e.target.value = '';
        }
    };

    const handleLoanValidate = async (data: any) => {
        try {
            await fetch("/api/liabilities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            setLoanDataToValidate(null);
            alert("Préstamo importado con éxito.");
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteBatch = async (batchId: string) => {
        if (!confirm("¿Eliminar este lote y todas sus transacciones importadas?")) return;

        setDeletingBatchId(batchId);
        try {
            const res = await fetch(`/api/ingestion/batches/${batchId}`, { method: "DELETE" });
            if (res.ok) {
                mutateBatches();
                mutate();
                mutateStats();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingBatchId(null);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            setNewCategoryName("");
            mutateCategories();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
            mutateCategories();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePurgeAll = async () => {
        const res = await fetch("/api/ingestion/purge", { method: "DELETE" });
        if (res.ok) {
            mutate();
            mutateStats();
            mutateBatches();
            setIsPurgeModalOpen(false);
        }
    };

    const confirmTx = async (id: string) => {
        await fetch(`/api/transactions/${id}/confirm`, { method: "PUT" });
        mutate();
        mutateStats();
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
    };

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

    const completedBatches = batches?.filter(b => b.status === "completed") || [];
    const pendingBatches = batches?.filter(b => b.status === "in_review") || [];

    const getBatchDateRange = (batch: IIngestionBatch) => {
        if (!batch.transactions?.length) return null;
        const dates = batch.transactions.map(t => t.date).filter(Boolean).sort();
        if (dates.length === 0) return null;
        return { from: dates[0], to: dates[dates.length - 1] };
    };

    const formatShortDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" });
        } catch { return dateStr; }
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

                <div className="flex gap-3">
                    <label className="cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
                        <FileSpreadsheet size={18} /> Subir Préstamo (PDF/Img)
                        <input type="file" className="hidden" accept=".pdf, image/*" onChange={(e) => handleFileUpload(e, "loan")} />
                    </label>
                    <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                        <FileSpreadsheet size={18} /> Subir Extractos (CSV/XLS)
                        <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={(e) => handleFileUpload(e, "statement")} />
                    </label>
                </div>
            </div>

            {/* AI Validation Modals / Overlays */}
            {loanDataToValidate && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <LoanValidationForm
                        initialData={loanDataToValidate}
                        onValidate={handleLoanValidate}
                        onCancel={() => setLoanDataToValidate(null)}
                    />
                </div>
            )}

            {isUploading && (
                <PremiumCard className="bg-emerald-50 border-emerald-100">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="animate-spin size-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full shrink-0"></div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-emerald-800">
                                {!uploadProgress && "Preparando..."}
                                {uploadProgress?.phase === "parsing" && "Parseando CSV..."}
                                {uploadProgress?.phase === "detecting" && "Detectando formato de columnas..."}
                                {uploadProgress?.phase === "parsed" && `${uploadProgress.parsedCount?.toLocaleString("es-ES")} transacciones detectadas`}
                                {uploadProgress?.phase === "categorizing" && `Categorizando con IA — Bloque ${uploadProgress.chunk} de ${uploadProgress.totalChunks}`}
                                {uploadProgress?.phase === "enriching" && "Enriqueciendo con datos históricos..."}
                            </p>
                            <p className="text-sm text-emerald-600">
                                {(!uploadProgress || uploadProgress.phase === "parsing") && "Analizando estructura del fichero..."}
                                {uploadProgress?.phase === "detecting" && "Usando IA para identificar columnas del CSV..."}
                                {uploadProgress?.phase === "parsed" && "Preparando categorización por bloques..."}
                                {uploadProgress?.phase === "categorizing" && `${uploadProgress.processed?.toLocaleString("es-ES")} / ${uploadProgress.total?.toLocaleString("es-ES")} transacciones procesadas`}
                                {uploadProgress?.phase === "enriching" && "Aplicando categorías de importaciones anteriores..."}
                            </p>
                        </div>
                    </div>
                    {uploadProgress?.phase === "categorizing" && uploadProgress.total && uploadProgress.processed !== undefined && (
                        <ProgressBar
                            progress={(uploadProgress.processed / uploadProgress.total) * 100}
                            colorClass="bg-emerald-500"
                        />
                    )}
                </PremiumCard>
            )}

            {/* Pending batches (in_review) */}
            {pendingBatches.length > 0 && (
                <PremiumCard className="border-amber-100 bg-amber-50/30">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={16} className="text-amber-500" />
                        <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest">Importaciones pendientes de revisión</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        {pendingBatches.map(batch => (
                            <div key={batch._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <Package size={16} className="text-amber-500" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{batch.fileName || "Extracto sin nombre"}</p>
                                        <p className="text-[10px] text-slate-400">{formatDate(batch.createdAt)} — {batch.confirmedCount}/{batch.totalCount} confirmadas</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/ingestion/review?batchId=${batch._id}&page=1`)}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                                >
                                    Continuar revisión
                                </button>
                            </div>
                        ))}
                    </div>
                </PremiumCard>
            )}

            {/* Grid: Stats, Batch History & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Col: Summary Stats + Batch History */}
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

                    {/* Batch History */}
                    <PremiumCard>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                            <Package size={12} className="inline mr-1" /> Historial de Importaciones
                        </h3>

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
                                                    onClick={() => router.push(`/ingestion/review?batchId=${batch._id}&page=1`)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBatch(batch._id!)}
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

                        {(completedBatches.length > 0 || (txs && txs.length > 0)) && (
                            <button
                                onClick={() => setIsPurgeModalOpen(true)}
                                className="mt-3 w-full text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 py-2 rounded-lg border border-transparent hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={12} /> Eliminar todo
                            </button>
                        )}
                    </PremiumCard>

                    {/* Categories Manager */}
                    <PremiumCard>
                        <button
                            onClick={() => setShowCategories(!showCategories)}
                            className="w-full flex items-center justify-between"
                        >
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <Tag size={12} className="inline mr-1" /> Categorías ({categories?.length || 0})
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400">{showCategories ? "Ocultar" : "Mostrar"}</span>
                        </button>

                        {showCategories && (
                            <div className="mt-4">
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                                        placeholder="Nueva categoría..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase"
                                    />
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={!newCategoryName.trim()}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                                    {categories?.map(cat => (
                                        <span key={cat._id} className="group inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-600 uppercase">
                                            {cat.name}
                                            <button
                                                onClick={() => handleDeleteCategory(cat._id!)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">
                                                    {tx.friendlyDescription || tx.description}
                                                    {tx.status === 'needs_review' && <span className="ml-2 inline-flex items-center text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-bold uppercase"><AlertCircle size={10} className="mr-0.5" /> REVISAR</span>}
                                                </p>
                                                {tx.friendlyDescription && tx.friendlyDescription !== tx.description && (
                                                    <p className="text-[11px] text-slate-400 truncate max-w-[300px]" title={tx.description}>{tx.description}</p>
                                                )}
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

            <ConfirmDeleteModal
                isOpen={isPurgeModalOpen}
                onClose={() => setIsPurgeModalOpen(false)}
                onConfirm={handlePurgeAll}
                itemName="todas las transacciones"
                itemType="historial completo de"
                description="Esta acción borrará permanentemente todas las transacciones importadas y todo el historial de importaciones. No se puede deshacer."
            />
        </main>
    );
}
