"use client";

import React from "react";
import { ShieldAlert, AlertCircle, FileText, CheckCircle2, FileSearch, Wallet } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IDocument, IReserve } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddDocumentForm } from "@/components/forms/AddDocumentForm";
import { AddReserveForm } from "@/components/forms/AddReserveForm";

export default function DocumentsPage() {
    const [isAddDocOpen, setIsAddDocOpen] = React.useState(false);
    const [isAddReserveOpen, setIsAddReserveOpen] = React.useState(false);
    const { data: docs, loading: loadingDocs, mutate: mutateDocs } = useApi<IDocument[]>("/api/documents");
    const { data: reserves, loading: loadingReserves, mutate: mutateReserves } = useApi<IReserve[]>("/api/reserves");
    const { t } = useI18n();

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    const totalGhost = reserves?.reduce((acc, curr) => acc + curr.balance, 0) || 0;
    const totalTarget = reserves?.reduce((acc, curr) => acc + curr.target, 0) || 0;

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <ShieldAlert size={32} className="text-slate-900" /> {t("vault.title")}
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-2">{t("vault.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Left Col: Documents */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t("vault.critical_documents")}</h2>
                        <button 
                            onClick={() => setIsAddDocOpen(true)}
                            className="text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
                        >
                            + {t("vault.upload_document")}
                        </button>
                    </div>

                    <PremiumCard className="!p-0">
                        {loadingDocs ? (
                            <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Cargando...</div>
                        ) : docs && docs.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {docs.map((doc: IDocument) => (
                                    <div key={doc._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${doc.type === 'property' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                doc.type === 'legal' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{doc.entity}</span>
                                                    <span className="size-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-xs font-medium text-slate-500">Subido: {doc.uploadDate}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            {doc.expirationDate && (
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vencimiento</p>
                                                    <p className="text-sm font-bold text-rose-500">{doc.expirationDate}</p>
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center justify-center w-16">
                                                {doc.status === 'verified' && (
                                                    <div className="flex flex-col items-center text-emerald-600">
                                                        <CheckCircle2 size={24} />
                                                        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Verif</span>
                                                    </div>
                                                )}
                                                {doc.status === 'active' && (
                                                    <div className="flex flex-col items-center text-indigo-600">
                                                        <FileText size={24} />
                                                        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Activo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4">
                                <EmptyState
                                    icon={FileSearch}
                                    title="Sin documentos"
                                    description="Sube escrituras, contratos o identificaciones para tenerlos a salvo y a mano."
                                    actionLabel="Subir Documento"
                                    actionHref="#"
                                />
                            </div>
                        )}
                    </PremiumCard>
                </div>

                {/* Right Col: Ghost Reserves Manager */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t("vault.ghost_reserves")}</h2>
                        <button 
                            onClick={() => setIsAddReserveOpen(true)}
                            className="text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
                        >
                            + {t("vault.new_reserve")}
                        </button>
                    </div>

                    {/* Master View */}
                    <PremiumCard className="bg-slate-900 border-black p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t("vault.accumulated")} Total</p>
                                <div className="flex items-baseline gap-3">
                                    <h3 className="text-4xl font-bold text-white tracking-tight">{formatCurrency(totalGhost)}</h3>
                                    <span className="text-emerald-400 text-sm font-bold font-mono">/ {formatCurrency(totalTarget)}</span>
                                </div>
                            </div>
                            <div className="h-14 w-14 rounded-full border-4 border-emerald-900 border-t-emerald-400 flex items-center justify-center text-emerald-400 font-bold text-sm">
                                {((totalGhost / (totalTarget || 1)) * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min((totalGhost / totalTarget) * 100, 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
                            <AlertCircle size={12} className="text-amber-500" /> Capital provisionado no disponible para operaciones corrientes.
                        </p>
                    </PremiumCard>

                    {/* Individual Reserve Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {loadingReserves ? (
                            <div className="animate-pulse flex-1 h-32 bg-slate-100 rounded-xl col-span-2"></div>
                        ) : reserves && reserves.length > 0 ? (
                            reserves.map((res: IReserve) => (
                                <PremiumCard key={res._id} className="p-5 flex flex-col justify-between h-40">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 mb-0.5">{res.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                Target: {formatCurrency(res.target)}
                                                {res.allocationPercent && <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 ml-1">{res.allocationPercent}% Auto</span>}
                                            </p>
                                        </div>
                                        {res.balance >= res.target && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <p className="text-xl font-bold text-slate-900">{formatCurrency(res.balance)}</p>
                                            {res.dueDate && <p className="text-[10px] font-bold text-rose-500 uppercase">Vence: {res.dueDate}</p>}
                                        </div>
                                        <ProgressBar
                                            progress={(res.balance / res.target) * 100}
                                            colorClass={res.balance >= res.target ? "bg-emerald-500" : res.type === 'tax' ? "bg-rose-500" : "bg-accent"}
                                            className="h-2"
                                        />
                                    </div>
                                </PremiumCard>
                            ))
                        ) : (
                            <div className="col-span-1 md:col-span-2">
                                <EmptyState
                                    icon={Wallet}
                                    title="Sin reservas fantasma"
                                    description="Crea tu primer sobre virtual para apartar dinero para impuestos o imprevistos de tus activos."
                                    actionLabel="Crear Reserva"
                                    actionHref="#"
                                />
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <AddDocumentForm 
                isOpen={isAddDocOpen} 
                onClose={() => setIsAddDocOpen(false)} 
                onSuccess={() => mutateDocs()} 
            />
            <AddReserveForm 
                isOpen={isAddReserveOpen} 
                onClose={() => setIsAddReserveOpen(false)} 
                onSuccess={() => mutateReserves()} 
            />
        </main>
    );
}
