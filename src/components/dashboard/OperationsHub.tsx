"use client";

import React, { useRef } from "react";
import { UploadCloud, FileSpreadsheet, Lock, AlertCircle, TrendingUp } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { ITransaction, IReserve } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

export default function OperationsHub() {
    const { data: transactions, loading: loadingTx, mutate: mutateTx } = useApi<ITransaction[]>("/api/transactions?limit=3");
    const { data: reserves, loading: loadingReserves } = useApi<IReserve[]>("/api/reserves");
    const { t } = useI18n();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/transactions/ingest", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                mutateTx();
                router.push("/ingestion");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* AI Ingestion Preview */}
            <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center mb-4 px-1">
                    <UploadCloud size={18} className="text-accent mr-2" /> {t("dashboard.ai_ingestion_title")}
                </h2>

                <PremiumCard className="mb-4">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-accent hover:bg-slate-50/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv, .xls, .xlsx"
                            onChange={handleFileUpload}
                        />
                        <div className="size-12 bg-emerald-50 text-accent rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet size={24} />
                        </div>
                        <p className="text-slate-900 font-bold mb-1">{t("dashboard.drop_statements")}</p>
                        <p className="text-slate-500 text-xs font-medium">{t("dashboard.csv_xls_supported")}</p>
                    </div>
                </PremiumCard>

                {loadingTx ? (
                    <div className="animate-pulse bg-slate-100 h-32 rounded-xl"></div>
                ) : (
                    <div className="space-y-3">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">{t("dashboard.recent_processing")}</h3>
                        {transactions?.map((tx: ITransaction) => (
                            <div key={tx._id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm hover:border-accent transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`size-8 rounded-full flex items-center justify-center ${tx.status === 'needs_review' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {tx.status === 'needs_review' ? <AlertCircle size={16} /> : <TrendingUp size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 line-clamp-1 truncate w-40">{tx.description}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{tx.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${tx.amount < 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                        {formatCurrency(tx.amount)}
                                    </p>
                                    <Badge variant={tx.status === 'needs_review' ? 'warning' : 'success'} className="mt-1 !text-[8px] py-0 px-1.5">
                                        {tx.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        <Link href="/ingestion" className="block text-center text-xs font-bold text-accent hover:text-teal-700 p-2">
                            Ver Hub Completo →
                        </Link>
                    </div>
                )}
            </div>

            {/* Ghost Money Reserves */}
            <div className="mt-4">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <Lock size={18} className="text-slate-900" /> {t("dashboard.ghost_money_reserves")}
                    </div>
                    <Link href="/vault" className="text-accent">+</Link>
                </h2>

                {loadingReserves ? (
                    <div className="animate-pulse bg-slate-100 h-48 rounded-xl"></div>
                ) : reserves && reserves.length > 0 ? (
                    <PremiumCard className="flex flex-col gap-5">
                        {reserves.slice(0, 3).map((res: IReserve) => {
                            const progress = (res.balance / res.target) * 100;
                            return (
                                <div key={res._id}>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-slate-900 text-sm font-bold flex items-center gap-2">
                                            {res.name}
                                            {progress >= 100 && <Badge variant="success" className="!text-[8px] py-0 px-1">Safe</Badge>}
                                        </p>
                                        <p className="text-slate-500 text-xs font-mono font-medium">
                                            <span className={progress >= 100 ? "text-emerald-600 font-bold" : "text-slate-900"}>
                                                {formatCurrency(res.balance)}
                                            </span>
                                            {" "}/ {formatCurrency(res.target)}
                                        </p>
                                    </div>
                                    <ProgressBar
                                        progress={progress}
                                        colorClass={progress >= 100 ? "bg-emerald-500" : res.type === 'tax' ? "bg-rose-500" : "bg-accent"}
                                    />
                                    {res.dueDate && (
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 text-right uppercase tracking-widest">
                                            {t("dashboard.due")}: {res.dueDate}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </PremiumCard>
                ) : (
                    <EmptyState
                        icon={Lock}
                        title="Sin Reservas"
                        description="Aún no tienes sobres guardados."
                        actionLabel="Crear Reserva"
                        actionHref="/documents"
                    />
                )}
            </div>

        </div>
    );
}
