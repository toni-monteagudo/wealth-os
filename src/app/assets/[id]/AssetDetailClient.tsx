"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { IAsset, ILiability, ITransaction, IAssetFinancials, IPaginatedResponse, Tenant } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { PremiumCard } from "@/components/ui/PremiumCard";
import {
    Building2, Pencil, CalendarDays, Maximize, Landmark, ArrowRightLeft, Trash2,
    Unlink, Link as LinkIcon, UserPlus, Phone, Mail, ChevronDown, ChevronUp,
    BedDouble, Bath, ArrowUpDown, CarFront, Calendar, Hash, TrendingUp, Banknote, PercentIcon
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { PieChart } from "@/components/ui/PieChart";
import { calculateRemainingBalance } from "@/lib/utils";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { EditAssetForm } from "@/components/forms/EditAssetForm";
import { LinkLiabilityModal } from "@/components/forms/LinkLiabilityModal";
import { AddTenantForm } from "@/components/forms/AddTenantForm";
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

const CATEGORY_COLORS = [
    "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export default function AssetDetailClient() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { t } = useI18n();

    const { data: asset, loading, mutate } = useApi<IAsset>(`/api/assets/${id}`);
    const { data: liabilities } = useApi<ILiability[]>("/api/liabilities");
    const { data: financials } = useApi<IAssetFinancials>(`/api/assets/${id}/financials`);

    const [txPage, setTxPage] = useState(1);
    const { data: txResponse } = useApi<IPaginatedResponse<ITransaction>>(
        `/api/transactions?linkedAssetId=${id}&paginated=true&limit=25&page=${txPage}`
    );

    const [selectedYear, setSelectedYear] = useState<string>("global");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
    const [showHistoricTenants, setShowHistoricTenants] = useState(false);

    // Derived data from paginated transactions
    const transactions = txResponse?.data || [];
    const txPagination = txResponse?.pagination;

    // Financials for the selected period
    const currentFinancials = useMemo(() => {
        if (!financials) return null;
        if (selectedYear === "global") return financials.global;
        return financials.byYear[selectedYear] || null;
    }, [financials, selectedYear]);

    const availableYears = useMemo(() => {
        if (!financials) return [];
        return Object.keys(financials.byYear).sort();
    }, [financials]);

    // Bar chart data: by month (if year selected) or by year (if global)
    const barChartData = useMemo(() => {
        if (!financials) return [];
        if (selectedYear === "global") {
            return availableYears.map(year => ({
                label: year,
                income: financials.byYear[year].totalIncome,
                expenses: Math.abs(financials.byYear[year].totalExpenses),
            }));
        }
        return financials.monthlyEvolution
            .filter(m => m.month.startsWith(selectedYear))
            .map(m => ({
                label: m.month.slice(5), // "01", "02", etc.
                income: m.income,
                expenses: Math.abs(m.expenses),
            }));
    }, [financials, selectedYear, availableYears]);

    // Area chart: cumulative cash flow over time
    const areaChartData = useMemo(() => {
        if (!financials) return [];
        const months = selectedYear === "global"
            ? financials.monthlyEvolution
            : financials.monthlyEvolution.filter(m => m.month.startsWith(selectedYear));
        let cumulative = 0;
        return months.map(m => {
            cumulative += m.cashFlow;
            return { label: selectedYear === "global" ? m.month : m.month.slice(5), cashFlow: cumulative };
        });
    }, [financials, selectedYear]);

    // Pie chart: expense categories (always uses selected period view via global byCategory)
    const categoryPieData = useMemo(() => {
        if (!financials) return [];
        const entries = Object.entries(financials.byCategory)
            .filter(([, v]) => v < 0) // only expenses
            .map(([name, value], i) => ({
                name,
                value: Math.abs(value),
                color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
            }))
            .sort((a, b) => b.value - a.value);
        return entries;
    }, [financials]);

    if (loading) return <div className="animate-pulse h-96 bg-slate-100 rounded-2xl w-full"></div>;
    if (!asset) return <div className="text-center p-20 text-slate-500">Asset not found.</div>;

    const handleDelete = async () => {
        const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
        if (res.ok) {
            router.push("/assets");
        } else {
            alert("Error al eliminar el activo. Por favor, inténtalo de nuevo.");
        }
    };

    const handleUnlink = async (mortgageId: string) => {
        try {
            const res = await fetch(`/api/liabilities/${mortgageId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkedAssetId: null }),
            });
            if (res.ok) {
                mutate();
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to unlink", error);
        }
    };

    const handleDeleteTenant = async (tenantId: string) => {
        try {
            const res = await fetch(`/api/assets/${id}/tenants`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId }),
            });
            if (res.ok) mutate();
        } catch (error) {
            console.error("Failed to delete tenant", error);
        }
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(num);
    };

    // Find linked liabilities for this asset
    const linkedLiabilities = liabilities?.filter((l: ILiability) => {
        const lId = typeof l.linkedAssetId === "object" ? (l.linkedAssetId as any)._id : l.linkedAssetId;
        return lId === asset._id;
    }) || [];

    // Tenant classification
    const allTenants = asset.tenants || [];
    const activeTenants = allTenants.filter(t => !t.contractEnd || new Date(t.contractEnd) >= new Date());
    const historicTenants = allTenants.filter(t => t.contractEnd && new Date(t.contractEnd) < new Date());

    // Capital gain
    const capitalGain = asset.value - (asset.purchasePrice || 0);

    // Net yield / margin from financials
    const netYield = (() => {
        if (!currentFinancials) return 0;
        if (asset.type === 'business') {
            return currentFinancials.totalIncome > 0
                ? (currentFinancials.cashFlow / currentFinancials.totalIncome) * 100
                : 0;
        }
        return asset.purchasePrice
            ? ((currentFinancials.totalIncome + currentFinancials.totalExpenses) / asset.purchasePrice) * 100
            : 0;
    })();

    const openAddTenant = () => {
        setEditingTenant(undefined);
        setIsTenantModalOpen(true);
    };

    const openEditTenant = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setIsTenantModalOpen(true);
    };

    const tooltipFormatter = (value: number | undefined) => formatCurrency(value ?? 0);

    return (
        <div className="flex flex-col gap-6">

            {/* Header Banner */}
            <div
                className="h-64 md:h-80 w-full rounded-3xl relative overflow-hidden flex items-end p-8"
                style={{
                    backgroundImage: asset.image ? `url('${asset.image}')` : 'none',
                    backgroundColor: asset.image ? undefined : (asset.type === 'business' ? '#4f46e5' : '#e2e8f0'),
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

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm shadow-lg hover:bg-slate-50 transition-colors"
                        >
                            <Pencil size={16} /> {t("asset_detail.edit_asset")}
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

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                itemName={asset.name}
                itemType="activo"
            />

            <EditAssetForm
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => mutate()}
                asset={asset}
            />

            <LinkLiabilityModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSuccess={() => {
                    mutate();
                    window.location.reload();
                }}
                assetId={asset._id!}
                availableLiabilities={liabilities || []}
            />

            <AddTenantForm
                isOpen={isTenantModalOpen}
                onClose={() => setIsTenantModalOpen(false)}
                onSuccess={() => mutate()}
                assetId={asset._id!}
                initialData={editingTenant}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Stats Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Top stats row — Real Estate only */}
                    {asset.type === 'real_estate' && (
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
                                <p className={`text-2xl font-bold ${capitalGain >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {capitalGain >= 0 ? "+" : ""}{formatCurrency(capitalGain)}
                                </p>
                            </PremiumCard>
                            <PremiumCard>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Maximize size={10} /> {t("asset_detail.area")}</p>
                                <p className="text-2xl font-bold text-slate-900">{asset.area} <span className="text-sm font-medium text-slate-400">m²</span></p>
                            </PremiumCard>
                        </div>
                    )}

                    {/* Year selector + KPIs from financials */}
                    {currentFinancials && (
                        <>
                            {/* Year Selector Tabs */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setSelectedYear("global")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                        selectedYear === "global"
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                                >
                                    Global
                                </button>
                                {availableYears.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => setSelectedYear(year)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                            selectedYear === year
                                                ? "bg-slate-900 text-white"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <PremiumCard className="bg-emerald-50 border-emerald-100">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={10} /> Ingresos Reales</p>
                                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(currentFinancials.totalIncome)}</p>
                                </PremiumCard>
                                <PremiumCard className="bg-rose-50 border-rose-100">
                                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Banknote size={10} /> Gastos Reales</p>
                                    <p className="text-2xl font-bold text-rose-700">{formatCurrency(currentFinancials.totalExpenses)}</p>
                                </PremiumCard>
                                <PremiumCard className={currentFinancials.cashFlow >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${currentFinancials.cashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}><Banknote size={10} /> Cash Flow</p>
                                    <p className={`text-2xl font-bold ${currentFinancials.cashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{formatCurrency(currentFinancials.cashFlow)}</p>
                                </PremiumCard>
                                <PremiumCard className={netYield >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${netYield >= 0 ? "text-emerald-600" : "text-rose-600"}`}><PercentIcon size={10} /> {asset.type === 'business' ? 'Margen Neto' : 'Rentabilidad Neta'}</p>
                                    <p className={`text-2xl font-bold ${netYield >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{netYield.toFixed(2)}%</p>
                                </PremiumCard>
                            </div>
                        </>
                    )}

                    {/* Charts Section */}
                    {financials && barChartData.length > 0 && (
                        <div className="flex flex-col gap-6">
                            {/* Income vs Expenses Bar Chart */}
                            <PremiumCard>
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-4">
                                    Ingresos vs Gastos {selectedYear !== "global" ? selectedYear : ""}
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barChartData} barGap={4}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                            <RechartsTooltip
                                                formatter={tooltipFormatter}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="expenses" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </PremiumCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cash Flow Evolution Area Chart */}
                                <PremiumCard>
                                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-4">
                                        Cash Flow Acumulado
                                    </h3>
                                    <div className="h-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={areaChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                                <RechartsTooltip
                                                    formatter={tooltipFormatter}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="cashFlow"
                                                    name="Cash Flow"
                                                    stroke="#10b981"
                                                    fill="#10b981"
                                                    fillOpacity={0.15}
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </PremiumCard>

                                {/* Category Breakdown Pie Chart */}
                                <PremiumCard>
                                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-4">
                                        Gastos por Categoría
                                    </h3>
                                    {categoryPieData.length > 0 ? (
                                        <>
                                            <PieChart
                                                data={categoryPieData}
                                                totalLabel="GASTOS"
                                                totalValue={formatCurrency(Math.abs(financials.global.totalExpenses))}
                                            />
                                            <div className="mt-3 flex flex-wrap gap-2 justify-center">
                                                {categoryPieData.slice(0, 6).map(item => (
                                                    <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                        <span className="size-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                                        {item.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                                            Sin gastos registrados
                                        </div>
                                    )}
                                </PremiumCard>
                            </div>
                        </div>
                    )}


                    {/* Tenants Section */}
                    {asset.type === 'real_estate' && (
                        <PremiumCard className="!p-0 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                    <UserPlus size={16} className="text-indigo-500" /> {t("asset_detail.tenants")}
                                </h3>
                                <button
                                    onClick={openAddTenant}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <UserPlus size={14} /> Añadir Inquilino
                                </button>
                            </div>

                            {activeTenants.length === 0 && historicTenants.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 font-medium">
                                    No hay inquilinos registrados. Añade uno para calcular la rentabilidad.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {/* Active Tenants */}
                                    {activeTenants.map((tenant) => (
                                        <div key={tenant._id || tenant.name} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="size-11 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 shrink-0 text-lg">
                                                {tenant.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-bold text-slate-900">{tenant.name}</p>
                                                    <Badge variant="success">Activo</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                    {tenant.phone && (
                                                        <span className="flex items-center gap-1"><Phone size={10} /> {tenant.phone}</span>
                                                    )}
                                                    {tenant.email && (
                                                        <span className="flex items-center gap-1"><Mail size={10} /> {tenant.email}</span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays size={10} /> Desde {tenant.contractStart}
                                                        {tenant.contractEnd && ` hasta ${tenant.contractEnd}`}
                                                    </span>
                                                </div>
                                                {tenant.deposit && (
                                                    <p className="text-[10px] text-slate-400 mt-1">Fianza: {formatCurrency(tenant.deposit)}</p>
                                                )}
                                                {tenant.notes && (
                                                    <p className="text-[10px] text-slate-400 mt-1 italic">{tenant.notes}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-bold text-emerald-600">{formatCurrency(tenant.monthlyRent)}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">/mes</p>
                                                <div className="flex gap-1 mt-2">
                                                    <button
                                                        onClick={() => openEditTenant(tenant)}
                                                        className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => tenant._id && handleDeleteTenant(tenant._id)}
                                                        className="px-2 py-1 text-[10px] font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Historic Tenants (collapsible) */}
                                    {historicTenants.length > 0 && (
                                        <>
                                            <button
                                                onClick={() => setShowHistoricTenants(!showHistoricTenants)}
                                                className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                            >
                                                <span>Histórico ({historicTenants.length})</span>
                                                {showHistoricTenants ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            {showHistoricTenants && historicTenants.map((tenant) => (
                                                <div key={tenant._id || tenant.name} className="p-5 flex items-start gap-4 bg-slate-50/50 opacity-70">
                                                    <div className="size-11 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center border border-slate-300 shrink-0 text-lg">
                                                        {tenant.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-bold text-slate-600">{tenant.name}</p>
                                                            <Badge variant="neutral">Finalizado</Badge>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays size={10} /> {tenant.contractStart} — {tenant.contractEnd}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-bold text-slate-500">{formatCurrency(tenant.monthlyRent)}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">/mes</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </PremiumCard>
                    )}

                    {/* Linked Transactions Section (paginated) */}
                    <PremiumCard className="!p-0 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                <ArrowRightLeft size={16} className="text-accent" /> {t("asset_detail.linked_transactions")}
                            </h3>
                            <span className="text-xs font-bold text-slate-500">
                                {txPagination ? `${txPagination.total} registros` : `${transactions.length} registros`}
                            </span>
                        </div>
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-medium">{t("asset_detail.no_transactions")}</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
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
                                                    <td className="px-5 py-3 font-bold text-slate-900">{tx.friendlyDescription || tx.description}</td>
                                                    <td className="px-5 py-3"><Badge variant="neutral">{tx.category}</Badge></td>
                                                    <td className={`px-5 py-3 text-right font-mono font-bold ${tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}`}>
                                                        {formatCurrency(tx.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {txPagination && txPagination.totalPages > 1 && (
                                    <div className="p-4 border-t border-slate-100">
                                        <Pagination
                                            page={txPagination.page}
                                            totalPages={txPagination.totalPages}
                                            onPageChange={setTxPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </PremiumCard>
                </div>

                {/* Side Column */}
                <div className="flex flex-col gap-6">

                    {/* Ficha Técnica — Real Estate */}
                    {asset.type === 'real_estate' && (
                        <PremiumCard>
                            <h3 className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-4">Ficha Técnica</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {asset.bedrooms != null && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <BedDouble size={14} className="text-slate-400" />
                                        <span className="text-slate-600">{asset.bedrooms} hab.</span>
                                    </div>
                                )}
                                {asset.bathrooms != null && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Bath size={14} className="text-slate-400" />
                                        <span className="text-slate-600">{asset.bathrooms} baños</span>
                                    </div>
                                )}
                                {asset.area != null && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Maximize size={14} className="text-slate-400" />
                                        <span className="text-slate-600">{asset.area} m²</span>
                                    </div>
                                )}
                                {asset.yearBuilt != null && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="text-slate-600">Año {asset.yearBuilt}</span>
                                    </div>
                                )}
                                {asset.hasElevator && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <ArrowUpDown size={14} className="text-emerald-500" />
                                        <span className="text-slate-600">Ascensor</span>
                                    </div>
                                )}
                                {asset.hasParking && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CarFront size={14} className="text-emerald-500" />
                                        <span className="text-slate-600">Garaje</span>
                                    </div>
                                )}
                            </div>
                            {asset.cadastralReference && (
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                                    <Hash size={12} />
                                    <span>Ref. Catastral: {asset.cadastralReference}</span>
                                </div>
                            )}
                        </PremiumCard>
                    )}

                    {/* Linked Loans from DB */}
                    {linkedLiabilities.length > 0 ? linkedLiabilities.map((mortgage) => (
                        <PremiumCard key={mortgage._id} className="border-rose-100 ring-4 ring-rose-50 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                                    <Landmark size={18} className="text-rose-500" /> {t("asset_detail.active_mortgage")}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUnlink(mortgage._id!)}
                                        className="size-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors shadow-sm"
                                        title="Desvincular préstamo"
                                    >
                                        <Unlink size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(calculateRemainingBalance(mortgage))}</p>
                                    <p className="text-rose-500 font-medium text-xs">Saldo Pendiente</p>
                                </div>
                                <div className="text-right">
                                    {(mortgage.tin != null || mortgage.tae != null) ? (
                                        <div className="flex flex-col items-end gap-0.5">
                                            {mortgage.tin != null && (
                                                <p className="text-sm font-bold text-slate-900">TIN {mortgage.tin}%</p>
                                            )}
                                            {mortgage.tae != null && (
                                                <p className="text-xs font-medium text-slate-500">TAE {mortgage.tae}%</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-bold text-slate-900">{mortgage.interestRate}%</p>
                                            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">{t("asset_detail.interest_rate")}</p>
                                        </>
                                    )}
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

                            <Link href="/loans" className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors block text-center">
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

                    {/* Add Existing Mortgage Button */}
                    <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm rounded-xl hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <LinkIcon size={16} /> Vincular Préstamo
                    </button>

                </div>
            </div>
        </div>
    );
}
