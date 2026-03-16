"use client";

import React from "react";
import Link from "next/link";
import { Landmark, Building2, CreditCard } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { ILiability, IAsset } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus } from "lucide-react";
import { AddLiabilityForm } from "@/components/forms/AddLiabilityForm";
import { calculateRemainingBalance } from "@/lib/utils";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export default function LoansPage() {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const { data: liabilities, loading, mutate } = useApi<ILiability[]>("/api/liabilities");
    const { t } = useI18n();

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    const totalDebt = liabilities?.reduce((s, l) => s + calculateRemainingBalance(l), 0) || 0;
    const totalMonthly = liabilities?.reduce((s, l) => s + l.monthlyPayment, 0) || 0;
    const avgInterest = liabilities && liabilities.length > 0
        ? (liabilities.reduce((s, l) => s + (l.tin !== undefined ? l.tin : l.interestRate), 0) / liabilities.length)
        : 0;

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Landmark size={32} className="text-slate-900" /> {t("loans.title")}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">{t("loans.subtitle")}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Añadir Préstamo
                </button>
            </div>

            {/* KPI Summary */}
            {!loading && liabilities && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <PremiumCard className="border-rose-100 ring-2 ring-rose-50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("loans.total_debt")}</p>
                        <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalDebt)}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("loans.monthly_total")}</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalMonthly)}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("loans.avg_interest")}</p>
                        <p className="text-2xl font-bold text-amber-600">{avgInterest.toFixed(2)}%</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("loans.num_loans")}</p>
                        <p className="text-2xl font-bold text-slate-900">{liabilities.length}</p>
                    </PremiumCard>
                </div>
            )}

            {/* Loans Table */}
            {loading ? (
                <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />
            ) : (
                <PremiumCard className="!p-0 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">{t("loans.all_loans")}</h3>
                        <span className="text-xs font-bold text-slate-500">{liabilities?.length || 0} registros</span>
                    </div>

                    {liabilities && liabilities.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("loans.type")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100">Nombre</th>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("loans.bank")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100 text-right">{t("loans.balance")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100 text-right">TIN / TAE</th>
                                        <th className="px-5 py-3 border-b border-slate-100 text-right">{t("loans.monthly_payment")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100">Vencimiento</th>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("loans.linked_asset")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {liabilities?.map((liability: ILiability) => {
                                        const linkedAsset = typeof liability.linkedAssetId === "object" ? liability.linkedAssetId as IAsset : null;
                                        return (
                                            <tr key={liability._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${liability.type === "mortgage"
                                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                                        }`}>
                                                        {liability.type === "mortgage" ? t("loans.mortgage") : t("loans.loan")}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Link href={`/loans/${liability._id}`} className="font-bold text-slate-900 hover:text-accent transition-colors block">
                                                        {liability.name}
                                                    </Link>
                                                    {liability.loanNumber && (
                                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t("loans.loan_number")}: {liability.loanNumber}</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-slate-600 font-medium">{liability.bank}</td>
                                                <td className="px-5 py-4 text-right font-mono font-bold text-rose-600">{formatCurrency(calculateRemainingBalance(liability))}</td>
                                                <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                                                    {liability.tin !== undefined ? `${liability.tin}%` : `${liability.interestRate}%`}
                                                    {liability.tae !== undefined && <span className="text-[10px] text-slate-400 font-medium ml-1">({liability.tae}%)</span>}
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">{formatCurrency(liability.monthlyPayment)}</td>
                                                <td className="px-5 py-4 text-slate-600 font-medium text-sm">
                                                    {liability.startDate && liability.termMonths
                                                        ? format(addMonths(new Date(liability.startDate), liability.termMonths), "MMM yyyy", { locale: es })
                                                        : <span className="text-slate-400 text-xs">—</span>
                                                    }
                                                </td>
                                                <td className="px-5 py-4">
                                                    {linkedAsset ? (
                                                        <Link href={`/assets/${linkedAsset._id}`} className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium text-xs">
                                                            <Building2 size={14} /> {linkedAsset.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">{t("loans.no_linked_asset")}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Totals Row */}
                                <tfoot>
                                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                        <td colSpan={3} className="px-5 py-4 text-right text-slate-500 uppercase tracking-widest text-xs">Total</td>
                                        <td className="px-5 py-4 text-right text-lg text-rose-600 font-mono">{formatCurrency(totalDebt)}</td>
                                        <td className="px-5 py-4 text-right text-slate-400 font-mono">{avgInterest.toFixed(2)}%</td>
                                        <td className="px-5 py-4 text-right text-lg text-slate-900 font-mono">{formatCurrency(totalMonthly)}</td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                icon={CreditCard}
                                title="No hay préstamos activos"
                                description="Registra tus hipotecas y préstamos personales para tener una visión clara de tus obligaciones y amortizaciones."
                                actionLabel="Añadir Préstamo"
                                onAction={() => setIsAddModalOpen(true)}
                            />
                        </div>
                    )}
                </PremiumCard>
            )}

            <AddLiabilityForm 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={() => mutate()} 
            />
        </main>
    );
}
