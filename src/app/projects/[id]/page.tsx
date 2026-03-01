"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { IProject, ITransaction } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Hammer, CalendarClock, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function ProjectPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: project, loading } = useApi<IProject>(`/api/projects/${id}`);
    const { data: transactions } = useApi<ITransaction[]>(`/api/transactions?linkedProjectId=${id}`);
    const { t } = useI18n();

    if (loading) return <div className="p-8 animate-pulse text-slate-400 font-bold">Cargando proyecto...</div>;
    if (!project) return <div className="p-8 text-slate-500 font-bold">Proyecto no encontrado.</div>;

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
    };

    return (
        <main className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">

            {/* Header Banner */}
            <div className="h-48 w-full rounded-3xl relative overflow-hidden flex items-end p-8 bg-slate-900">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-400 via-slate-900 to-black"></div>
                <div className="relative w-full flex justify-between items-end z-10">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                            <Hammer size={12} /> {project.progress >= 100 ? t("projects.completed") : t("projects.in_course")}
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-1">{project.name}</h1>
                        <p className="text-slate-400 font-medium">{project.description}</p>
                    </div>
                    <button className="px-5 py-2.5 bg-accent text-white rounded-lg font-bold text-sm shadow-md transition-colors hover:bg-teal-600">
                        {t("projects.new_expense")}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Column: Expenses Table */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <PremiumCard className="!p-0 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">{t("projects.cost_breakdown")}</h3>
                            <span className="text-xs font-bold text-slate-500">{project.expenses.length} Entradas</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("projects.concept")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("projects.provider")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100">{t("projects.status")}</th>
                                        <th className="px-5 py-3 border-b border-slate-100 text-right">{t("projects.amount")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {project.expenses.map((exp: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-slate-900 mb-0.5">{exp.concept}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{exp.category}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 font-medium">{exp.provider}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${exp.status === 'Pagado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    exp.status === 'Depósito' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {exp.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                                                {formatCurrency(exp.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                        <td colSpan={3} className="px-5 py-4 text-right text-slate-500 uppercase tracking-widest text-xs">Total Ejecutado</td>
                                        <td className="px-5 py-4 text-right text-lg text-slate-900">{formatCurrency(project.actualSpent)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </PremiumCard>

                    {/* Linked Transactions Section */}
                    <PremiumCard className="!p-0 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                <ArrowRightLeft size={16} className="text-accent" /> {t("projects.linked_transactions")}
                            </h3>
                            <span className="text-xs font-bold text-slate-500">{transactions?.length || 0} registros</span>
                        </div>
                        {(!transactions || transactions.length === 0) ? (
                            <div className="p-8 text-center text-slate-400 font-medium">{t("projects.no_transactions")}</div>
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

                {/* Side Column: Stats & Notes */}
                <div className="flex flex-col gap-6">

                    <PremiumCard>
                        <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Resumen Presupuestario</h3>

                        <div className="flex justify-between items-end mb-1">
                            <span className="text-3xl font-bold text-slate-900 tracking-tight">{((project.actualSpent / project.budget) * 100).toFixed(1)}%</span>
                            <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mb-1">
                                {t("projects.within_margin")}
                            </span>
                        </div>

                        <div className="h-2 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${project.actualSpent > project.budget ? 'bg-rose-500' : 'bg-slate-900'}`}
                                style={{ width: `${Math.min((project.actualSpent / project.budget) * 100, 100)}%` }}
                            ></div>
                        </div>

                        <div className="mt-4 flex justify-between text-sm">
                            <div>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t("projects.budgeted")}</p>
                                <p className="font-mono font-bold text-slate-600">{formatCurrency(project.budget)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t("projects.remaining")}</p>
                                <p className={`font-mono font-bold ${project.actualSpent > project.budget ? 'text-rose-500' : 'text-slate-900'}`}>
                                    {formatCurrency(project.budget - project.actualSpent)}
                                </p>
                            </div>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="flex flex-col flex-1 bg-slate-50 border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-between">
                            {t("projects.construction_notes")} <CalendarClock size={16} className="text-slate-400" />
                        </h3>

                        <div className="flex-1 space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                            {project.notes.map((note: any, idx: number) => (
                                <div key={idx} className={`p-3 rounded-lg border text-sm ${note.isImportant ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${note.isImportant ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {note.date}
                                        </span>
                                        {note.isImportant && <span className="size-2 rounded-full bg-rose-500 animate-pulse"></span>}
                                    </div>
                                    <p className={`font-medium ${note.isImportant ? 'text-rose-900' : 'text-slate-700'}`}>{note.text}</p>
                                </div>
                            ))}
                        </div>

                        <input
                            type="text"
                            placeholder={t("projects.quick_note")}
                            className="mt-4 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </PremiumCard>

                </div>
            </div>
        </main>
    );
}
