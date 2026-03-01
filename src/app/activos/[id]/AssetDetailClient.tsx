"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { IAsset, ILiability, ITransaction } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Building2, Pencil, CalendarDays, Maximize, Landmark, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function AssetDetailClient() {
    const params = useParams();
    const id = params.id as string;
    const { data: asset, loading } = useApi<IAsset>(`/api/assets/${id}`);
    const { data: liabilities } = useApi<ILiability[]>("/api/liabilities");
    const { data: transactions } = useApi<ITransaction[]>(`/api/transactions?linkedAssetId=${id}`);
    const { t } = useI18n();

    if (loading) return <div className="animate-pulse h-96 bg-slate-100 rounded-2xl w-full"></div>;
    if (!asset) return <div className="text-center p-20 text-slate-500">Asset not found.</div>;

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    // Find linked liabilities for this asset
    const linkedLiabilities = liabilities?.filter((l: ILiability) => {
        const lId = typeof l.linkedAssetId === "object" ? (l.linkedAssetId as any)._id : l.linkedAssetId;
        return lId === asset._id;
    }) || [];

    return (
        <div className="flex flex-col gap-6">

            {/* Header Banner */}
            <div
                className="h-64 md:h-80 w-full rounded-3xl relative overflow-hidden flex items-end p-8"
                style={{
                    backgroundImage: asset.type === 'real_estate' && asset.image ? `url('${asset.image}')` : 'none',
                    backgroundColor: asset.type === 'business' ? '#4f46e5' : '#e2e8f0',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                <div className="relative w-full flex justify-between items-end z-10">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3">
                            <Building2 size={14} /> {asset.type === 'real_estate' ? 'Real Estate' : 'Business'}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{asset.name}</h1>
                        <p className="text-white/80 font-medium flex items-center gap-2">
                            {asset.location || 'Global/Digital'}
                        </p>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm shadow-lg hover:bg-slate-50 transition-colors">
                        <Pencil size={16} /> {t("asset_detail.edit_asset")}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Stats Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <PremiumCard>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("asset_detail.current_valuation")}</p>
                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(asset.value)}</p>
                        </PremiumCard>
                        <PremiumCard>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("asset_detail.purchase_price")}</p>
                            <p className="text-2xl font-bold text-slate-600">{formatCurrency(asset.purchasePrice || 0)}</p>
                        </PremiumCard>
                        <PremiumCard>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("asset_detail.gross_capital_gain")}</p>
                            <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(asset.value - (asset.purchasePrice || 0))}</p>
                        </PremiumCard>
                        {asset.type === 'real_estate' && (
                            <PremiumCard>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Maximize size={10} /> {t("asset_detail.area")}</p>
                                <p className="text-2xl font-bold text-slate-900">{asset.area} <span className="text-sm font-medium text-slate-400">m²</span></p>
                            </PremiumCard>
                        )}
                    </div>

                    <PremiumCard className="min-h-[300px] flex items-center justify-center bg-slate-50 border border-slate-200 shadow-none">
                        <div className="text-center text-slate-400">
                            <p className="font-bold mb-2">[{t("asset_detail.value_history")} Chart Placeholder]</p>
                            <p className="text-xs">Integrate Recharts AreaChart here mapping property valuation over time.</p>
                        </div>
                    </PremiumCard>

                    {/* Linked Transactions Section */}
                    <PremiumCard className="!p-0 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                <ArrowRightLeft size={16} className="text-accent" /> {t("asset_detail.linked_transactions")}
                            </h3>
                            <span className="text-xs font-bold text-slate-500">{transactions?.length || 0} registros</span>
                        </div>
                        {(!transactions || transactions.length === 0) ? (
                            <div className="p-8 text-center text-slate-400 font-medium">{t("asset_detail.no_transactions")}</div>
                        ) : (
                            <div className="overflow-x-auto max-h-[300px]">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-5 py-3 border-b border-slate-100">Fecha</th>
                                            <th className="px-5 py-3 border-b border-slate-100">Descripción</th>
                                            <th className="px-5 py-3 border-b border-slate-100">Categoría</th>
                                            <th className="px-5 py-3 border-b border-slate-100 text-right">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {transactions.map((tx) => (
                                            <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 text-slate-500 font-medium">{tx.date}</td>
                                                <td className="px-5 py-3 font-bold text-slate-900">{tx.description}</td>
                                                <td className="px-5 py-3"><Badge variant="neutral">{tx.category}</Badge></td>
                                                <td className={`px-5 py-3 text-right font-mono font-bold ${tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}`}>
                                                    {formatCurrency(tx.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </PremiumCard>
                </div>

                {/* Side Column (Mortgage, Yield, Tenants) */}
                <div className="flex flex-col gap-6">

                    {/* Linked Loans from DB */}
                    {linkedLiabilities.length > 0 ? linkedLiabilities.map((mortgage) => (
                        <PremiumCard key={mortgage._id} className="border-rose-100 ring-4 ring-rose-50 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                                    <Landmark size={18} className="text-rose-500" /> {t("asset_detail.active_mortgage")}
                                </h3>
                                <div className="size-8 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center font-bold font-mono text-xs">
                                    %
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(mortgage.balance)}</p>
                                    <p className="text-rose-500 font-medium text-xs">Saldo Pendiente</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">{mortgage.interestRate}%</p>
                                    <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">{t("asset_detail.interest_rate")}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-slate-100 mb-4 flex justify-between items-center shadow-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("asset_detail.monthly_installment")}</span>
                                <span className="font-mono font-bold text-slate-900">{formatCurrency(mortgage.monthlyPayment)}</span>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-slate-100 mb-4 flex justify-between items-center shadow-sm">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("loans.bank")}</span>
                                <span className="font-medium text-slate-700 text-sm">{mortgage.bank}</span>
                            </div>

                            <Link href="/prestamos" className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors block text-center">
                                {t("asset_detail.amortization_schedule")}
                            </Link>
                        </PremiumCard>
                    )) : asset.type === 'real_estate' && (
                        <PremiumCard className="border-slate-200 p-6">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Landmark size={18} />
                                <h3 className="font-bold text-sm">{t("asset_detail.active_mortgage")}</h3>
                            </div>
                            <p className="text-sm text-slate-400">{t("asset_detail.no_loans")}</p>
                        </PremiumCard>
                    )}

                    {/* Tenants */}
                    {asset.type === 'real_estate' && asset.tenants && asset.tenants.length > 0 && (
                        <PremiumCard>
                            <h3 className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-4">{t("asset_detail.tenants")}</h3>
                            {asset.tenants.map((tenant, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200">
                                        {tenant.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{tenant.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                            <CalendarDays size={10} /> Hasta {tenant.contractUntil}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </PremiumCard>
                    )}

                    {asset.type === 'business' && (
                        <PremiumCard className="bg-indigo-50 border-indigo-100">
                            <h3 className="text-indigo-900 font-bold text-lg mb-4">{t("dashboard.mrr")} Overview</h3>
                            <p className="text-4xl font-bold text-indigo-700 mb-2">${asset.mrr?.toLocaleString()}</p>
                            <p className="text-indigo-600/80 text-sm font-medium">Monthly Recurring Revenue</p>
                        </PremiumCard>
                    )}
                </div>
            </div>
        </div>
    );
}
