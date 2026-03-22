"use client";

import React from "react";
import Link from "next/link";
import { Hammer, Clock, Plane, Plus } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useApi } from "@/hooks/useApi";
import { IProject, ProjectType } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddProjectForm } from "@/components/forms/AddProjectForm";

const FILTER_TABS: { key: string; type?: ProjectType }[] = [
    { key: "filter_all" },
    { key: "filter_renovations", type: "renovation" },
    { key: "filter_vacations", type: "vacation" },
];

export default function ProjectsListPage() {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [activeFilter, setActiveFilter] = React.useState<ProjectType | undefined>(undefined);
    const apiUrl = activeFilter ? `/api/projects?type=${activeFilter}` : "/api/projects";
    const { data: projects, loading, mutate } = useApi<IProject[]>(apiUrl);
    const { t } = useI18n();

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    const getProjectIcon = (project: IProject) => {
        return (project.type ?? "renovation") === "vacation" ? Plane : Hammer;
    };

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Hammer size={32} className="text-slate-900" /> {t("projects.all_projects")}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">{t("projects.all_projects_subtitle")}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    {t("projects.new_project")}
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.type)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                            activeFilter === tab.type
                                ? "bg-slate-900 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {t(`projects.${tab.key}`)}
                    </button>
                ))}
            </div>

            {/* KPI Summary */}
            {!loading && projects && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Proyectos</p>
                        <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("projects.budgeted")}</p>
                        <p className="text-2xl font-bold text-slate-600">{formatCurrency(projects.reduce((s, p) => s + p.budget, 0))}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("dashboard.actual")}</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(projects.reduce((s, p) => s + p.actualSpent, 0))}</p>
                    </PremiumCard>
                    <PremiumCard>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("projects.remaining")}</p>
                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(projects.reduce((s, p) => s + (p.budget - p.actualSpent), 0))}</p>
                    </PremiumCard>
                </div>
            )}

            {/* Projects Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="animate-pulse h-48 bg-slate-100 rounded-2xl" />)}
                </div>
            ) : projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((proj: IProject) => {
                        const Icon = getProjectIcon(proj);
                        const projType = proj.type ?? "renovation";
                        return (
                            <Link key={proj._id} href={`/projects/${proj._id}`}>
                                <PremiumCard className="p-6 flex flex-col gap-4 hover:border-accent hover:shadow-lg transition-all group h-full">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${projType === "vacation" ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-600"}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-slate-900 font-bold text-xl mb-1 group-hover:text-accent transition-colors">{proj.name}</h3>
                                                {projType === "vacation" && proj.destination && (
                                                    <p className="text-sky-600 text-xs font-bold mb-0.5">{proj.destination}</p>
                                                )}
                                                <p className="text-slate-500 text-sm font-medium">{proj.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <Badge variant={proj.progress >= 100 ? "success" : "info"}>
                                                {proj.progress >= 100 ? t("projects.completed") : t("projects.in_course")}
                                            </Badge>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                projType === "vacation"
                                                    ? "bg-sky-50 text-sky-600"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}>
                                                {t(`projects.type_${projType}`)}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-baseline mb-1.5">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t("dashboard.actual")} / {t("projects.budgeted")}</span>
                                            <span className="text-slate-900 font-bold text-sm">
                                                {formatCurrency(proj.actualSpent)} <span className="text-slate-400 font-medium">/ {formatCurrency(proj.budget)}</span>
                                            </span>
                                        </div>
                                        <ProgressBar progress={(proj.actualSpent / proj.budget) * 100} colorClass={proj.actualSpent > proj.budget ? "bg-rose-500" : "bg-accent"} />
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                            <Clock size={12} /> {projType === "vacation" ? t("projects.return_date") : t("projects.estimated_end_date")}
                                        </div>
                                        <span className="text-slate-600 font-medium text-xs">{proj.estimatedEnd}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="font-bold">{proj.expenses.length}</span> gastos registrados
                                    </div>
                                </PremiumCard>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={Hammer}
                    title="No hay proyectos en marcha"
                    description="Crea tu primer proyecto para gestionar su presupuesto."
                    actionLabel={t("projects.new_project")}
                    actionHref="#"
                />
            )}

            <AddProjectForm
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => mutate()}
            />
        </main>
    );
}
