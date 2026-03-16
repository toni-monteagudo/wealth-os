"use client";

import React from "react";
import Link from "next/link";
import { Building2, Briefcase } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IAsset, ILiability } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus } from "lucide-react";
import { AddAssetForm } from "@/components/forms/AddAssetForm";
import { calculateRemainingBalance } from "@/lib/utils";

export default function AssetsListPage() {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const { data: assets, loading: loadingAssets, mutate: mutateAssets } = useApi<IAsset[]>("/api/assets");
    const { data: liabilities } = useApi<ILiability[]>("/api/liabilities");
    const { t } = useI18n();

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 size={32} className="text-slate-900" /> {t("assets_list.title")}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">{t("assets_list.subtitle")}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Añadir Activo
                </button>
            </div>

            {/* KPI Summary */}
            {!loadingAssets && assets && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Activos</p>
                        <p className="text-2xl font-bold text-slate-900">{assets.length}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("dashboard.current_value")}</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(assets.reduce((s, a) => s + a.value, 0))}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("assets_list.real_estate")}</p>
                        <p className="text-2xl font-bold text-indigo-600">{assets.filter(a => a.type === "real_estate").length}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("assets_list.business")}</p>
                        <p className="text-2xl font-bold text-violet-600">{assets.filter(a => a.type === "business").length}</p>
                    </PremiumCard>
                </div>
            )}

            {/* Assets Grid / Empty State */}
            {loadingAssets ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-64 bg-slate-100 rounded-2xl" />)}
                </div>
            ) : assets && assets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assets.map((asset: IAsset) => {
                        const linkedMortgage = liabilities?.find((l: ILiability) => {
                            const lId = typeof l.linkedAssetId === "object" ? (l.linkedAssetId as any)._id : l.linkedAssetId;
                            return lId === asset._id;
                        });

                        if (asset.type === "real_estate") {
                            return (
                                <Link key={asset._id} href={`/assets/${asset._id}`}>
                                    <PremiumCard className="!p-0 overflow-hidden flex flex-col hover:border-accent hover:shadow-lg transition-all group h-full">
                                        <div
                                            className="h-40 w-full bg-cover bg-center relative"
                                            style={{ backgroundImage: `url('${asset.image}')` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent group-hover:from-slate-900/70 transition-all" />
                                            <div className="absolute bottom-3 left-4">
                                                <h3 className="text-white font-bold text-lg drop-shadow-sm">{asset.name}</h3>
                                                <p className="text-white/80 text-xs font-medium">{asset.location}</p>
                                            </div>
                                            <div className="absolute top-3 right-3 glass-overlay px-2 py-1 rounded text-[10px] text-slate-900 font-bold border border-white/50 uppercase">
                                                {t("assets_list.real_estate")}
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col justify-between">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t("dashboard.current_value")}</p>
                                                    <p className="text-slate-900 font-bold text-xl">{formatCurrency(asset.value)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t("dashboard.mortgage")}</p>
                                                    <p className="text-rose-500 font-bold text-xl">{formatCurrency(calculateRemainingBalance(linkedMortgage))}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <span className="text-slate-500 font-medium">{t("dashboard.annual_yield")}</span>
                                                <span className="text-accent font-bold font-mono">{asset.rentalYield || 0}%</span>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </Link>
                            );
                        } else {
                            return (
                                <Link key={asset._id} href={`/assets/${asset._id}`}>
                                    <PremiumCard className="!p-0 overflow-hidden flex flex-col hover:border-accent hover:shadow-lg transition-all group h-full">
                                        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="size-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200">
                                                        <Briefcase size={20} />
                                                    </div>
                                                    <h3 className="text-slate-900 font-bold text-lg">{asset.name}</h3>
                                                </div>
                                                <p className="text-slate-500 text-xs font-medium">{asset.location || "Global/Digital"}</p>
                                            </div>
                                            <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100 uppercase">
                                                {t("assets_list.business")}
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t("dashboard.mrr")}</p>
                                                    <p className="text-slate-900 font-bold text-2xl">${asset.mrr?.toLocaleString()}<span className="text-sm text-slate-400 font-medium">/mo</span></p>
                                                </div>
                                                {asset.momGrowth && (
                                                    <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                        +{asset.momGrowth}% MoM
                                                    </span>
                                                )}
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-2">{t("dashboard.current_value")}</p>
                                                <p className="text-slate-900 font-bold text-lg">{formatCurrency(asset.value)}</p>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </Link>
                            );
                        }
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={Building2}
                    title="No tienes activos registrados"
                    description="Registra tu primera propiedad inmobiliaria o negocio para comenzar a trazar tu patrimonio."
                    actionLabel="Añadir Activo"
                    onAction={() => setIsAddModalOpen(true)}
                />
            )}

            <AddAssetForm 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={() => mutateAssets()} 
            />
        </main>
    );
}
