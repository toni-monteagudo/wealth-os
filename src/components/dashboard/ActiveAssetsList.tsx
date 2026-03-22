"use client";

import React from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IAsset, ILiability } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { calculateRemainingBalance } from "@/lib/utils";

export default function ActiveAssetsList() {
    const { data: assets, loading: loadingAssets } = useApi<IAsset[]>("/api/assets");
    const { data: liabilities, loading: loadingLiabs } = useApi<ILiability[]>("/api/liabilities");
    const { t } = useI18n();

    if (loadingAssets || loadingLiabs) return <div className="animate-pulse flex-1 h-64 bg-slate-100 rounded-xl"></div>;

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-slate-900" /> {t("dashboard.active_assets")}
                </div>
                <button className="text-accent">+</button>
            </h2>

            {(!assets || assets.length === 0) ? (
                <EmptyState
                    icon={Building2}
                    title="No hay activos"
                    description="Actualmente no tienes activos registrados en el sistema."
                    actionLabel="Crear uno"
                    actionHref="/assets"
                />
            ) : assets.map((asset: IAsset) => {
                // Find linked liability
                const linkedMortgage = liabilities?.find((l: ILiability) => {
                    const lId = typeof l.linkedAssetId === "object" ? (l.linkedAssetId as any)._id : l.linkedAssetId;
                    return lId === asset._id;
                });

                if (asset.type === "real_estate") {
                    return (
                        <Link key={asset._id} href={`/assets/${asset._id}`}>
                            <PremiumCard className="!p-0 overflow-hidden flex flex-col hover:border-accent">
                                <div
                                    className="h-36 w-full bg-cover bg-center relative"
                                    style={{ backgroundImage: `url('${asset.image}')` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                    <div className="absolute bottom-3 left-4">
                                        <h3 className="text-white font-bold text-lg drop-shadow-sm">{asset.name}</h3>
                                        <p className="text-white/80 text-xs font-medium">{asset.location}</p>
                                    </div>
                                    <div className="absolute top-3 right-3 glass-overlay px-2 py-1 rounded text-[10px] text-slate-900 font-bold border border-white/50 uppercase">
                                        Real Estate
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t("dashboard.current_value")}</p>
                                            <p className="text-slate-900 font-bold text-xl">${(asset.value / 1000).toFixed(0)}k</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t("dashboard.mortgage")}</p>
                                            <p className="text-rose-500 font-bold text-xl">${(calculateRemainingBalance(linkedMortgage) / 1000).toFixed(0)}k</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="text-slate-500 font-medium">{t("dashboard.annual_yield")}</span>
                                        <span className="text-accent font-bold font-mono">{asset.rentalYield}%</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                                            <span>{t("dashboard.reserves_health")}</span>
                                            <span className="text-emerald-600 font-bold">{t("dashboard.good")}</span>
                                        </div>
                                        <ProgressBar progress={85} />
                                    </div>
                                </div>
                            </PremiumCard>
                        </Link>
                    );
                } else {
                    return (
                        <Link key={asset._id} href={`/assets/${asset._id}`}>
                            <PremiumCard className="!p-0 overflow-hidden flex flex-col hover:border-accent">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="size-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200">
                                                {asset.name.charAt(0)}
                                            </div>
                                            <h3 className="text-slate-900 font-bold text-lg">{asset.name}</h3>
                                        </div>
                                        <p className="text-slate-500 text-xs font-medium">B2B Micro-SaaS Portfolio</p>
                                    </div>
                                    <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100 uppercase">
                                        Business
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t("dashboard.mrr")}</p>
                                            <p className="text-slate-900 font-bold text-2xl">${asset.mrr?.toLocaleString()}<span className="text-sm text-slate-400 font-medium">/mo</span></p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                +{asset.momGrowth}% MoM
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-3">{t("dashboard.staff_overview")}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {asset.employees?.map((emp: any, i: number) => (
                                                    <div key={i} className="h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-slate-900 font-bold text-sm">${(asset.monthlyPayroll || 0) / 1000}k</p>
                                                <p className="text-slate-500 text-[10px] font-medium">{t("dashboard.monthly_payroll")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                        </Link>
                    );
                }
            })}
        </div>
    );
}
