"use client";

import React from "react";
import Link from "next/link";
import { Hammer, Folder, Clock, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IProject, IDocument } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";

export default function ProjectVaultColumn() {
    const { data: projects, loading: loadingProj } = useApi<IProject[]>("/api/projects");
    const { data: documents, loading: loadingDocs } = useApi<IDocument[]>("/api/documents?limit=4");
    const { t } = useI18n();

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* active projects wrapper */}
            <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <Hammer size={18} className="text-accent" /> {t("dashboard.projects_vault")}
                    </div>
                    <button className="text-accent">+</button>
                </h2>

                {loadingProj ? (
                    <div className="animate-pulse flex-1 h-32 bg-slate-100 rounded-xl"></div>
                ) : (
                    <div className="space-y-4">
                        {projects?.map((proj: IProject) => (
                            <PremiumCard key={proj._id} className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-slate-900 font-bold text-lg mb-1">{proj.name}</h3>
                                        <p className="text-slate-500 text-xs font-medium">{proj.description}</p>
                                    </div>
                                    <Badge variant={proj.progress >= 100 ? "success" : "info"} className="!text-[8px]">
                                        {proj.progress >= 100 ? t("projects.completed") : t("projects.in_course")}
                                    </Badge>
                                </div>

                                <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t("projects.actual")} / {t("projects.budgeted")}</span>
                                        <span className="text-slate-900 font-bold text-sm">
                                            {formatCurrency(proj.actualSpent)} <span className="text-slate-400 font-medium">/ {formatCurrency(proj.budget)}</span>
                                        </span>
                                    </div>
                                    <ProgressBar progress={(proj.actualSpent / proj.budget) * 100} colorClass={proj.actualSpent > proj.budget ? "bg-rose-500" : "bg-accent"} />
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                        <Clock size={12} /> {t("projects.estimated_end_date")}
                                    </div>
                                    <span className="text-slate-600 font-medium text-xs">{proj.estimatedEnd}</span>
                                </div>
                            </PremiumCard>
                        ))}
                    </div>
                )}
            </div>

            {/* Document Vault */}
            <div className="mt-2">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <Folder size={18} className="text-slate-900" /> {t("dashboard.document_vault")}
                    </div>
                    <Link href="/documentos" className="text-accent font-bold uppercase text-[10px] tracking-wider">{t("dashboard.upload")}</Link>
                </h2>

                {loadingDocs ? (
                    <div className="animate-pulse flex-1 h-48 bg-slate-100 rounded-xl"></div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {documents?.slice(0, 4).map((doc: IDocument, idx: number) => (
                            <div key={doc._id} className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${idx !== 0 ? 'border-t border-slate-100' : ''}`}>
                                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${doc.type === 'property' ? 'bg-indigo-50 text-indigo-600' :
                                    doc.type === 'legal' ? 'bg-emerald-50 text-emerald-600' :
                                        'bg-amber-50 text-amber-600'
                                    }`}>
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{doc.name}</p>
                                    <div className="flex gap-2 items-center mt-0.5">
                                        <span className="text-[10px] text-slate-500 font-medium">{doc.entity}</span>
                                        <span className="size-1 bg-slate-200 rounded-full"></span>
                                        <span className="text-[10px] text-slate-400 font-mono">{doc.fileType}</span>
                                    </div>
                                </div>
                                <div>
                                    {doc.status === 'verified' && <CheckCircle2 size={18} className="text-emerald-500" />}
                                    {doc.status === 'pending' && <Clock size={16} className="text-amber-500" />}
                                </div>
                            </div>
                        ))}
                        <Link href="/documentos" className="block w-full text-center bg-slate-50 text-slate-600 font-bold text-xs py-3 border-t border-slate-200 hover:text-slate-900 transition-colors">
                            Ver Todos los Documentos
                        </Link>
                    </div>
                )}
            </div>

        </div>
    );
}
