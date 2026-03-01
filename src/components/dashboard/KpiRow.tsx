"use client";

import React from "react";
import { TrendingUp, PieChart, Wallet, Flag } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IKPIs } from "@/types";
import { useI18n } from "@/i18n/I18nContext";

export default function KpiRow() {
    const { data: kpis, loading } = useApi<IKPIs>("/api/kpis");
    const { t } = useI18n();

    if (loading || !kpis) {
        return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse text-transparent">...loading</div>;
    }

    // Format currencies short eg 2.4M
    const formatCompact = (num: number) => {
        return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Net Worth */}
            <PremiumCard className="p-5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={48} className="text-slate-900" />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t("dashboard.net_worth")}</p>
                <div className="flex items-baseline gap-3">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">${formatCompact(kpis.netWorth)}</h3>
                    <span className="inline-flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <TrendingUp size={14} className="mr-0.5" /> +{kpis.netWorthGrowth}%
                    </span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 w-[75%] rounded-full"></div>
                </div>
            </PremiumCard>

            {/* LTV Ratio */}
            <PremiumCard className="p-5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PieChart size={48} className="text-slate-900" />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t("dashboard.ltv_ratio")}</p>
                <div className="flex items-baseline gap-3">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{kpis.ltvRatio}%</h3>
                    <span className="inline-flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {kpis.ltvRatio < 50 ? t("dashboard.good") : "Warning"}
                    </span>
                </div>
                <div className="mt-4 flex gap-1">
                    <div className="h-1.5 flex-1 bg-emerald-500 rounded-l-full"></div>
                    <div className="h-1.5 flex-1 bg-emerald-500/50"></div>
                    <div className="h-1.5 flex-1 bg-slate-200"></div>
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-r-full"></div>
                </div>
            </PremiumCard>

            {/* Monthly FCF */}
            <PremiumCard className="p-5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet size={48} className="text-slate-900" />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{t("dashboard.monthly_fcf")}</p>
                <div className="flex items-baseline gap-3">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">${formatCompact(kpis.monthlyFcf)}</h3>
                    <span className="inline-flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <TrendingUp size={14} className="mr-0.5" /> +{kpis.monthlyFcfGrowth}%
                    </span>
                </div>
                <div className="mt-4 flex justify-between text-xs font-medium text-slate-500">
                    <span>{t("dashboard.in")}: ${formatCompact(kpis.fcfIn)}</span>
                    <span className="text-rose-500">{t("dashboard.out")}: ${formatCompact(kpis.fcfOut)}</span>
                </div>
            </PremiumCard>

            {/* FI Goal */}
            <PremiumCard className="p-5">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Flag size={48} className="text-slate-900" />
                </div>
                <div className="flex justify-between items-end mb-1">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t("dashboard.fi_goal")}</p>
                    <p className="text-slate-900 text-sm font-bold">{kpis.fiGoalProgress}%</p>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">{t("dashboard.target")}: $3.5M</h3>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-accent rounded-full" style={{ width: `${kpis.fiGoalProgress}%` }}></div>
                    <div className="absolute top-0 h-full w-0.5 bg-white shadow-sm" style={{ left: `${kpis.fiGoalProgress}%` }}></div>
                </div>
            </PremiumCard>
        </div>
    );
}
