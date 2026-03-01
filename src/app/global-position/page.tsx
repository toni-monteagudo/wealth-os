"use client";

import React, { useState, useMemo } from "react";
import { Globe, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { ITransaction, IAsset, IProject } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GlobalPositionPage() {
    const { data: transactions, loading: loadingTx } = useApi<ITransaction[]>("/api/transactions?limit=200");
    const { data: assets } = useApi<IAsset[]>("/api/assets");
    const { data: projects } = useApi<IProject[]>("/api/projects");
    const { t } = useI18n();

    const [filterAsset, setFilterAsset] = useState<string>("");
    const [filterProject, setFilterProject] = useState<string>("");

    const filtered = useMemo(() => {
        if (!transactions) return [];
        let result = transactions;
        if (filterAsset) result = result.filter(tx => tx.linkedAssetId === filterAsset);
        if (filterProject) result = result.filter(tx => tx.linkedProjectId === filterProject);
        return result;
    }, [transactions, filterAsset, filterProject]);

    const totalIncome = filtered.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
    const totalExpenses = filtered.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const netBalance = totalIncome - totalExpenses;

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
    };

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Globe size={32} className="text-slate-900" /> {t("global_position.title")}
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-2">{t("global_position.subtitle")}</p>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PremiumCard className="border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <ArrowUpRight size={16} className="text-emerald-600" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("global_position.total_income")}</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                </PremiumCard>
                <PremiumCard className="border-rose-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                            <ArrowDownRight size={16} className="text-rose-600" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("global_position.total_expenses")}</p>
                    </div>
                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
                </PremiumCard>
                <PremiumCard className={netBalance >= 0 ? "border-emerald-100 ring-2 ring-emerald-50" : "border-rose-100 ring-2 ring-rose-50"}>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("global_position.net_balance")}</p>
                    <p className={`text-3xl font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCurrency(netBalance)}</p>
                </PremiumCard>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("global_position.filter_by_asset")}</label>
                    <select
                        value={filterAsset}
                        onChange={(e) => setFilterAsset(e.target.value)}
                        className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                        <option value="">{t("global_position.all")}</option>
                        {assets?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("global_position.filter_by_project")}</label>
                    <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                        <option value="">{t("global_position.all")}</option>
                        {projects?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            {loadingTx ? (
                <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />
            ) : (
                <PremiumCard className="!p-0 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">{t("global_position.all_transactions")}</h3>
                        <span className="text-xs font-bold text-slate-500">{filtered.length} registros</span>
                    </div>

                    {filtered.length > 0 ? (
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("global_position.date")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("global_position.description")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("global_position.category")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100 text-right">{t("global_position.amount")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("global_position.linked_to")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filtered.map((tx: ITransaction) => {
                                        const assetName = assets?.find(a => a._id === tx.linkedAssetId)?.name;
                                        const projectName = projects?.find(p => p._id === tx.linkedProjectId)?.name;
                                        return (
                                            <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-4 text-slate-500 font-medium">{tx.date}</td>
                                                <td className="px-5 py-4 font-bold text-slate-900">{tx.description}</td>
                                                <td className="px-5 py-4">
                                                    <Badge variant="neutral">{tx.category}</Badge>
                                                </td>
                                                <td className={`px-5 py-4 text-right font-mono font-bold ${tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        {assetName && <span className="text-xs text-indigo-600 font-medium">🏠 {assetName}</span>}
                                                        {projectName && <span className="text-xs text-accent font-medium">🔨 {projectName}</span>}
                                                        {!assetName && !projectName && <span className="text-xs text-slate-400">—</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                icon={Activity}
                                title="Aún no hay movimientos bancarios"
                                description="Sube aquí tu primer extracto bancario en CSV u hoja de cálculo y la IA lo autoclasificará por ti."
                                actionLabel="Subir Extracto (IA)"
                                actionHref="/ingestion"
                            />
                        </div>
                    )}
                </PremiumCard>
            )}
        </main>
    );
}
