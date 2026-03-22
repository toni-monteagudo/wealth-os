"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Banknote, ArrowLeft, Loader2, Landmark, Clock, FileWarning, Percent, Trash2, Building2, Unlink, Link as LinkIcon, Pencil } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { ILiability, IAsset } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { format, addMonths, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { LinkAssetModal } from "@/components/forms/LinkAssetModal";
import { AddLiabilityForm } from "@/components/forms/AddLiabilityForm";

export default function LoanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useI18n();
    const { data: loan, loading, mutate } = useApi<ILiability>(`/api/liabilities/${params.id}`);
    const { data: allAssets } = useApi<IAsset[]>("/api/assets");
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const handleDelete = async () => {
        const res = await fetch(`/api/liabilities/${params.id}`, { method: "DELETE" });
        if (res.ok) {
            router.push("/loans");
        } else {
            alert("Error al eliminar el préstamo. Por favor, inténtalo de nuevo.");
        }
    };

    const handleUnlink = async () => {
        try {
            const res = await fetch(`/api/liabilities/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkedAssetId: null }),
            });
            if (res.ok) {
                mutate();
            }
        } catch (error) {
            console.error("Failed to unlink", error);
        }
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
    };

    // --- Amortization Math ---
    const amortizationSchedule = useMemo(() => {
        if (!loan || !loan.initialCapital || !loan.termMonths || !loan.startDate) return [];

        const principal = loan.initialCapital;
        const annualRate = loan.tin !== undefined ? loan.tin : loan.interestRate;
        const months = loan.termMonths;
        const start = new Date(loan.startDate);

        const monthlyRate = (annualRate / 100) / 12;

        // Real monthly payment from the user; fallback to theoretical French PMT
        const theoreticalPmt = monthlyRate > 0
            ? principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
            : principal / months;
        const pmt = loan.monthlyPayment && loan.monthlyPayment > 0 ? loan.monthlyPayment : theoreticalPmt;

        // Recalculate what initial capital the bank used to arrive at `pmt`
        // so the schedule zeroes out exactly at `months` with the real payment.
        // PV = pmt * [ 1 - (1+r)^-n ] / r
        const impliedPrincipal = monthlyRate > 0
            ? pmt * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate
            : pmt * months;

        const schedule = [];
        let activeBalance = impliedPrincipal;

        for (let i = 1; i <= months; i++) {
            const interestPayment = activeBalance * monthlyRate;
            let payment = pmt;
            let principalPayment = payment - interestPayment;
            let nextBalance = activeBalance - principalPayment;

            // Adjust last payment roundings
            if (i === months || nextBalance < 0.01) {
                principalPayment = activeBalance;
                payment = principalPayment + interestPayment;
                nextBalance = 0;
            }

            schedule.push({
                month: i,
                date: addMonths(start, i),
                payment,
                principalPayment,
                interestPayment,
                remainingBalance: Math.max(0, nextBalance)
            });

            activeBalance = nextBalance;
            if (activeBalance <= 0) break;
        }

        return schedule;
    }, [loan]);

    // Current State Calculations
    const currentStatus = useMemo(() => {
        if (!loan || !loan.startDate || !loan.termMonths || amortizationSchedule.length === 0) return null;

        const now = new Date();
        const start = new Date(loan.startDate);
        const annualRate = loan.tin !== undefined ? loan.tin : loan.interestRate;
        const monthlyRate = (annualRate / 100) / 12;
        const monthsElapsed = differenceInMonths(now, start);

        const theoreticalPmt = monthlyRate > 0
            ? loan.initialCapital! * (monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) / (Math.pow(1 + monthlyRate, loan.termMonths) - 1)
            : loan.initialCapital! / loan.termMonths;
        const pmt = loan.monthlyPayment && loan.monthlyPayment > 0 ? loan.monthlyPayment : theoreticalPmt;

        // Remaining balance via PV of remaining payments (matches what the bank reports)
        const monthsRemaining = Math.max(0, loan.termMonths - monthsElapsed);
        let remainingBalance: number;
        if (monthlyRate > 0 && monthsRemaining > 0) {
            remainingBalance = pmt * (1 - Math.pow(1 + monthlyRate, -monthsRemaining)) / monthlyRate;
        } else {
            remainingBalance = pmt * monthsRemaining;
        }

        const currentIndex = Math.max(0, Math.min(monthsElapsed - 1, amortizationSchedule.length - 1));
        const totalInterestPaid = amortizationSchedule.slice(0, currentIndex + 1).reduce((s, row) => s + row.interestPayment, 0);
        const totalPrincipalPaid = loan.initialCapital! - remainingBalance;

        return {
            remainingBalance,
            nextPaymentDate: amortizationSchedule[Math.min(currentIndex + 1, amortizationSchedule.length - 1)].date,
            totalInterestPaid,
            totalPrincipalPaid,
            monthsRemaining
        };
    }, [loan, amortizationSchedule]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 size={32} className="animate-spin" />
            </div>
        );
    }

    if (!loan) {
        return <div className="p-8 text-center text-rose-500 font-bold">Préstamo no encontrado</div>;
    }

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold mb-4"
                >
                    <ArrowLeft size={16} /> Volver
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                {loan.name}
                            </h1>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {loan.type === 'mortgage' ? 'Hipoteca' : 'Préstamo'}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                            <Landmark size={14} /> {loan.bank} {loan.loanNumber ? `· ${loan.loanNumber}` : ''}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-200 transition-colors"
                        >
                            <Pencil size={16} /> Editar
                        </button>
                        <button 
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-sm shadow-lg hover:bg-rose-700 transition-colors"
                        >
                            <Trash2 size={16} /> Eliminar
                        </button>
                    </div>
                </div>
            </div>

            <AddLiabilityForm
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => mutate()}
                initialData={loan}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                itemName={loan.name}
                itemType="préstamo"
            />

            <LinkAssetModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSuccess={() => mutate()}
                liabilityId={loan._id!}
                assets={allAssets || []}
            />

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PremiumCard className="bg-slate-900 text-white border-transparent">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Saldo Pendiente (Calculado)</p>
                    <p className="text-3xl font-bold text-white">
                        {currentStatus ? formatCurrency(currentStatus.remainingBalance) : "N/A"}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs font-medium text-slate-300">
                        <span>Original:</span>
                        <span>{loan.initialCapital ? formatCurrency(loan.initialCapital) : "N/A"}</span>
                    </div>
                </PremiumCard>
                
                <PremiumCard>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Próximo Pago</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {currentStatus ? formatCurrency(loan.monthlyPayment || amortizationSchedule[0]?.payment || 0) : "N/A"}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-medium text-slate-500">
                        <span>Fecha:</span>
                        <span className="font-bold text-accent">
                            {currentStatus?.nextPaymentDate ? format(currentStatus.nextPaymentDate, "dd MMM yyyy", { locale: es }) : "N/A"}
                        </span>
                    </div>
                </PremiumCard>

                <PremiumCard>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Progreso del Préstamo</p>
                    <div className="flex items-end gap-2 text-2xl font-bold text-slate-900">
                        {loan.termMonths && currentStatus ? (
                            <span>{Math.round(((loan.termMonths - currentStatus.monthsRemaining) / loan.termMonths) * 100)}%</span>
                        ) : "N/A"}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-medium text-slate-500">
                        <span>Meses restantes:</span>
                        <span className="font-bold">{currentStatus?.monthsRemaining || "N/A"}</span>
                    </div>
                </PremiumCard>

                <PremiumCard>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Intereses Pagados vs Restantes</p>
                    <div className="flex gap-1 h-8 bg-slate-100 rounded-md overflow-hidden mt-3">
                        {/* A small pseudo chart */}
                        {amortizationSchedule.length > 0 && currentStatus && (
                            <>
                                <div 
                                    className="bg-rose-500 h-full" 
                                    style={{ width: `${(currentStatus.totalInterestPaid / amortizationSchedule.reduce((a,b)=>a+b.interestPayment, 0)) * 100}%` }}
                                    title="Pagados"
                                />
                            </>
                        )}
                    </div>
                    <div className="mt-4 pt-4 flex justify-between text-xs font-medium text-slate-500">
                        <span>Total abonado: {currentStatus ? formatCurrency(currentStatus.totalInterestPaid) : "N/A"}</span>
                    </div>
                </PremiumCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <PremiumCard>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Percent size={16} className="text-accent" /> Condiciones
                        </h3>
                        <div className="space-y-4">
                            {loan.tin !== undefined ? (
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-sm">
                                    <span className="text-slate-500 font-medium">TIN</span>
                                    <span className="font-bold text-slate-900">{loan.tin}% {loan.interestType === 'fixed' ? '(Fijo)' : '(Variable)'}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-sm">
                                    <span className="text-slate-500 font-medium">Interés Nominal</span>
                                    <span className="font-bold text-slate-900">{loan.interestRate}% {loan.interestType === 'fixed' ? '(Fijo)' : '(Variable)'}</span>
                                </div>
                            )}
                            {loan.tae !== undefined && (
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-sm">
                                    <span className="text-slate-500 font-medium">TAE</span>
                                    <span className="font-bold text-slate-900">{loan.tae}%</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-sm">
                                <span className="text-slate-500 font-medium">Plazo de concesión</span>
                                <span className="font-bold text-slate-900">{loan.termMonths} meses</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-sm">
                                <span className="text-slate-500 font-medium">Fecha de firma</span>
                                <span className="font-bold text-slate-900">{loan.startDate ? format(new Date(loan.startDate), "dd MMM yyyy", { locale: es }) : "No indicada"}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-sm">
                                <span className="text-slate-500 font-medium">Fecha de vencimiento</span>
                                <span className="font-bold text-slate-900">{loan.startDate && loan.termMonths ? format(addMonths(new Date(loan.startDate), loan.termMonths), "dd MMM yyyy", { locale: es }) : "No indicada"}</span>
                            </div>
                             <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-sm">
                                <span className="text-slate-500 font-medium">Día de pago mensual</span>
                                <span className="font-bold text-slate-900">{loan.paymentChargeDay ? `Día ${loan.paymentChargeDay}` : "Depende de la firma"}</span>
                            </div>
                        </div>
                    </PremiumCard>

                    {(loan.lateInterestRate || loan.amortizationCommission || loan.cancellationCommission) && (
                        <PremiumCard className="bg-orange-50/50 border-orange-100">
                            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileWarning size={16} className="text-orange-500" /> Penalizaciones y Comisiones
                            </h3>
                            <div className="space-y-3">
                                {loan.lateInterestRate && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-orange-700 font-medium">Interés de demora</span>
                                        <span className="font-bold text-orange-900">{loan.lateInterestRate}%</span>
                                    </div>
                                )}
                                {loan.amortizationCommission && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-orange-700 font-medium">Comisión amortización parcial</span>
                                        <span className="font-bold text-orange-900">{loan.amortizationCommission}%</span>
                                    </div>
                                )}
                                {loan.cancellationCommission && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-orange-700 font-medium">Comisión cancelación total</span>
                                        <span className="font-bold text-orange-900">{loan.cancellationCommission}%</span>
                                    </div>
                                )}
                            </div>
                        </PremiumCard>
                    )}

                    {/* vinculacion a activo */}
                    {loan.linkedAssetId ? (
                        <PremiumCard className="border-indigo-100 ring-2 ring-indigo-50 p-6 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-slate-900 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                    <Building2 size={16} className="text-indigo-500" /> Activo Vinculado
                                </h3>
                                <button 
                                    onClick={handleUnlink}
                                    className="size-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors shadow-sm"
                                    title="Desvincular Activo"
                                >
                                    <Unlink size={14} />
                                </button>
                            </div>
                            
                            {/* find the related asset details to display its name if possible */}
                            {allAssets?.find(a => a._id === (typeof loan.linkedAssetId === 'string' ? loan.linkedAssetId : (loan.linkedAssetId as any)._id)) ? (
                                (() => {
                                    const linkedAsset = allAssets.find(a => a._id === (typeof loan.linkedAssetId === 'string' ? loan.linkedAssetId : (loan.linkedAssetId as any)._id))!;
                                    return (
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-indigo-100/50 flex items-center justify-center border border-indigo-200">
                                                <span className="text-lg">{linkedAsset.type === 'real_estate' ? '🏠' : '💼'}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight">{linkedAsset.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 tracking-wider">
                                                    Valoración: {formatCurrency(linkedAsset.value)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <p className="text-sm font-medium text-slate-500">Cargando datos del activo...</p>
                            )}
                        </PremiumCard>
                    ) : (
                        <button 
                            onClick={() => setIsLinkModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm rounded-xl hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <LinkIcon size={16} /> Vincular a un Activo
                        </button>
                    )}
                </div>

                {/* Amortization Table */}
                <div className="lg:col-span-2">
                    <PremiumCard className="!p-0 overflow-hidden h-full flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" /> Tabla de Amortización (Sistema Francés)
                            </h3>
                        </div>
                        
                        {amortizationSchedule.length > 0 ? (
                            <div className="overflow-auto max-h-[600px]">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 border-b border-slate-100 shadow-sm z-10">
                                        <tr>
                                            <th className="px-5 py-3"># Cuota</th>
                                            <th className="px-5 py-3">Fecha</th>
                                            <th className="px-5 py-3 text-right">Cuota Total</th>
                                            <th className="px-5 py-3 text-right text-rose-600">Intereses</th>
                                            <th className="px-5 py-3 text-right text-emerald-600">Amort. Capital</th>
                                            <th className="px-5 py-3 text-right">Capital Pendiente</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {amortizationSchedule.map((row) => {
                                            // Highlight rows close to the current month
                                            const isPast = row.date < new Date();
                                            
                                            return (
                                                <tr key={row.month} className={`${isPast ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-slate-50'} transition-colors`}>
                                                    <td className="px-5 py-3 font-medium">{row.month}</td>
                                                    <td className="px-5 py-3">{format(row.date, "MMM yyyy", { locale: es })}</td>
                                                    <td className="px-5 py-3 text-right font-mono font-medium text-slate-900">{formatCurrency(row.payment)}</td>
                                                    <td className="px-5 py-3 text-right font-mono font-medium text-rose-500">{formatCurrency(row.interestPayment)}</td>
                                                    <td className="px-5 py-3 text-right font-mono font-medium text-emerald-500">{formatCurrency(row.principalPayment)}</td>
                                                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(row.remainingBalance)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center text-slate-500">
                                <Banknote size={32} className="mb-3 opacity-50" />
                                <p className="font-bold text-slate-700">No se puede generar la tabla</p>
                                <p className="text-sm mt-1 max-w-sm">Faltan datos de origen del préstamo (Capital inicial, Plazo en meses o Fecha de firma) para poder calcular el calendario de pagos.</p>
                            </div>
                        )}
                    </PremiumCard>
                </div>
            </div>
        </main>
    );
}
