"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, AlertCircle, Package } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { IIngestionBatch } from "@/types";

interface ImportToolbarProps {
    batches: IIngestionBatch[];
    onUploadComplete: () => void;
}

export function ImportToolbar({ batches, onUploadComplete }: ImportToolbarProps) {
    const router = useRouter();

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [userContext, setUserContext] = useState("");
    const [useOnlyExistingCategories, setUseOnlyExistingCategories] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        phase: string;
        chunk?: number;
        totalChunks?: number;
        processed?: number;
        total?: number;
        parsedCount?: number;
        message?: string;
    } | null>(null);

    const pendingBatches = batches?.filter(b => b.status === "in_review") || [];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingFile(file);
        setUserContext("");
        e.target.value = '';
    };

    const handleConfirmUpload = async () => {
        if (!pendingFile) return;
        const file = pendingFile;
        setPendingFile(null);

        setIsUploading(true);
        setUploadProgress(null);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "statement");
        if (userContext.trim()) {
            formData.append("userContext", userContext.trim());
        }
        formData.append("useOnlyExistingCategories", String(useOnlyExistingCategories));

        try {
            const res = await fetch("/api/ingestion/analyze", {
                method: "POST",
                body: formData,
            });

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
                                onUploadComplete();
                                router.push(`/global-position/review?batchId=${data.batchId}&page=1`);
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
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el motor de IA.");
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
        }
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

    return (
        <>
            {/* Upload button bar */}
            <div className="flex justify-end">
                <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                    <FileSpreadsheet size={18} /> Subir Extractos (CSV/XLS)
                    <input type="file" className="hidden" accept=".csv, .xls, .xlsx" onChange={handleFileSelect} />
                </label>
            </div>

            {/* Pre-upload context modal */}
            {pendingFile && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Preparar importación</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Archivo: <span className="font-medium text-slate-700">{pendingFile.name}</span>
                        </p>

                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Contexto adicional para la IA (opcional)
                        </label>
                        <textarea
                            value={userContext}
                            onChange={(e) => setUserContext(e.target.value)}
                            rows={4}
                            placeholder="Ej: Las transacciones de Stripe son ingresos de mi SaaS. Los Bizum a María son alquiler del piso de Valencia. ENDESA es el suministro del local comercial..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5 mb-4">
                            Cualquier detalle que ayude a la IA a categorizar mejor: qué empresa genera los ingresos, a qué corresponden pagos recurrentes, etc.
                        </p>

                        <label className="flex items-center gap-2.5 mb-5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={useOnlyExistingCategories}
                                onChange={(e) => setUseOnlyExistingCategories(e.target.checked)}
                                className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                            />
                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                                Usar solo categorías existentes <span className="text-slate-400">(no sugerir nuevas)</span>
                            </span>
                        </label>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setPendingFile(null)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                className="btn-accent px-6 py-2 shadow-md shadow-emerald-500/20"
                            >
                                Procesar con IA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload progress */}
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
                                    onClick={() => router.push(`/global-position/review?batchId=${batch._id}&page=1`)}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                                >
                                    Continuar revisión
                                </button>
                            </div>
                        ))}
                    </div>
                </PremiumCard>
            )}
        </>
    );
}
