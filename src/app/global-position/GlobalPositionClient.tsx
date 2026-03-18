"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Globe, ArrowUpRight, ArrowDownRight, Activity, Search, X, ChevronUp, ChevronDown, Settings2 } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Pagination } from "@/components/ui/Pagination";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { ITransaction, IAsset, IProject, ICategory, ITransactionStats, IPaginatedResponse } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const PAGE_SIZE = 50;

export default function GlobalPositionClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useI18n();

    // Read filters from URL
    const filterAsset = searchParams.get("linkedAssetId") || "";
    const filterProject = searchParams.get("linkedProjectId") || "";
    const filterCategory = searchParams.get("category") || "";
    const filterDateFrom = searchParams.get("dateFrom") || "";
    const filterDateTo = searchParams.get("dateTo") || "";
    const filterSearch = searchParams.get("search") || "";
    const filterAmountMin = searchParams.get("amountMin") || "";
    const filterAmountMax = searchParams.get("amountMax") || "";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Local state for search input (debounced)
    const [searchInput, setSearchInput] = useState(filterSearch);
    const debouncedSearch = useDebounce(searchInput, 300);

    // Column visibility
    type ColumnKey = "date" | "description" | "friendlyDescription" | "category" | "amount" | "tags" | "linkedTo";
    const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
        date: true,
        description: true,
        friendlyDescription: true,
        category: true,
        amount: true,
        tags: true,
        linkedTo: true,
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showColumnMenu) return;
        const handler = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
                setShowColumnMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showColumnMenu]);

    const columnLabels: Record<ColumnKey, string> = {
        date: t("global_position.date"),
        friendlyDescription: "Desc. amigable",
        description: t("global_position.description") + " (original)",
        category: t("global_position.category"),
        amount: t("global_position.amount"),
        tags: "Tags",
        linkedTo: t("global_position.linked_to"),
    };

    const toggleColumn = (key: ColumnKey) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Sync debounced search to URL
    useEffect(() => {
        if (debouncedSearch !== filterSearch) {
            updateParams({ search: debouncedSearch });
        }
    }, [debouncedSearch]);

    // Build API query string from URL params (excluding UI-only params)
    const apiQuery = useMemo(() => {
        const params = new URLSearchParams();
        if (filterAsset) params.set("linkedAssetId", filterAsset);
        if (filterProject) params.set("linkedProjectId", filterProject);
        if (filterCategory) params.set("category", filterCategory);
        if (filterDateFrom) params.set("dateFrom", filterDateFrom);
        if (filterDateTo) params.set("dateTo", filterDateTo);
        if (filterSearch) params.set("search", filterSearch);
        if (filterAmountMin) params.set("amountMin", filterAmountMin);
        if (filterAmountMax) params.set("amountMax", filterAmountMax);
        return params.toString();
    }, [filterAsset, filterProject, filterCategory, filterDateFrom, filterDateTo, filterSearch, filterAmountMin, filterAmountMax]);

    // Data fetching
    const { data: stats } = useApi<ITransactionStats>(
        `/api/transactions/stats${apiQuery ? `?${apiQuery}` : ""}`
    );
    const { data: txResponse, loading: loadingTx } = useApi<IPaginatedResponse<ITransaction>>(
        `/api/transactions?paginated=true&limit=${PAGE_SIZE}&page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}${apiQuery ? `&${apiQuery}` : ""}`
    );
    const { data: assets } = useApi<IAsset[]>("/api/assets");
    const { data: projects } = useApi<IProject[]>("/api/projects");
    const { data: categories } = useApi<ICategory[]>("/api/categories");

    const transactions = txResponse?.data || [];
    const totalPages = txResponse?.pagination?.totalPages || 1;
    const totalIncome = stats?.totalIncome || 0;
    const totalExpenses = stats?.totalExpenses || 0;
    const netBalance = stats?.netBalance || 0;

    const hasActiveFilters = !!(filterAsset || filterProject || filterCategory || filterDateFrom || filterDateTo || filterSearch || filterAmountMin || filterAmountMax);

    const updateParams = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        // Reset to page 1 when filters change (unless explicitly setting page)
        if (!("page" in updates)) params.set("page", "1");
        router.push(`/global-position?${params.toString()}`);
    }, [searchParams, router]);

    const clearFilters = useCallback(() => {
        setSearchInput("");
        router.push("/global-position");
    }, [router]);

    const handleSort = useCallback((field: string) => {
        updateParams({
            sortBy: field,
            sortOrder: sortBy === field && sortOrder === "desc" ? "asc" : "desc",
            page: currentPage.toString(),
        });
    }, [sortBy, sortOrder, currentPage, updateParams]);

    const handlePageChange = useCallback((page: number) => {
        updateParams({ page: page.toString() });
    }, [updateParams]);

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ChevronDown size={12} className="text-slate-300" />;
        return sortOrder === "asc"
            ? <ChevronUp size={12} className="text-slate-700" />
            : <ChevronDown size={12} className="text-slate-700" />;
    };

    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Globe size={32} className="text-slate-900" /> {t("global_position.title")}
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-2">{t("global_position.subtitle")}</p>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PremiumCard className="border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <ArrowUpRight size={16} className="text-emerald-600" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("global_position.total_income")}</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                </PremiumCard>
                <PremiumCard className="border-rose-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                            <ArrowDownRight size={16} className="text-rose-600" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("global_position.total_expenses")}</p>
                    </div>
                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
                </PremiumCard>
                <PremiumCard className={netBalance >= 0 ? "border-emerald-100 ring-2 ring-emerald-50" : "border-rose-100 ring-2 ring-rose-50"}>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{t("global_position.net_balance")}</p>
                    <p className={`text-3xl font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCurrency(netBalance)}</p>
                </PremiumCard>
            </div>

            {/* Filters */}
            <PremiumCard className="!py-4 !px-5">
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Search */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.description")}</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t("global_position.search_description")}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                            />
                        </div>
                    </div>

                    {/* Date From */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.date_from")}</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => updateParams({ dateFrom: e.target.value })}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>

                    {/* Date To */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.date_to")}</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => updateParams({ dateTo: e.target.value })}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.category")}</label>
                        <select
                            value={filterCategory}
                            onChange={(e) => updateParams({ category: e.target.value })}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">{t("global_position.all")}</option>
                            {categories?.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Asset */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.filter_by_asset")}</label>
                        <select
                            value={filterAsset}
                            onChange={(e) => updateParams({ linkedAssetId: e.target.value })}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">{t("global_position.all")}</option>
                            {assets?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                    </div>

                    {/* Project */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.filter_by_project")}</label>
                        <select
                            value={filterProject}
                            onChange={(e) => updateParams({ linkedProjectId: e.target.value })}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">{t("global_position.all")}</option>
                            {projects?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Amount Min */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.amount_min")}</label>
                        <input
                            type="number"
                            value={filterAmountMin}
                            onChange={(e) => updateParams({ amountMin: e.target.value })}
                            placeholder="0"
                            className="w-28 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>

                    {/* Amount Max */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("global_position.amount_max")}</label>
                        <input
                            type="number"
                            value={filterAmountMax}
                            onChange={(e) => updateParams({ amountMax: e.target.value })}
                            placeholder="0"
                            className="w-28 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-lg transition-colors self-end"
                        >
                            <X size={14} /> {t("global_position.clear_filters")}
                        </button>
                    )}
                </div>
            </PremiumCard>

            {/* Transactions Table */}
            {loadingTx ? (
                <div className="animate-pulse h-64 bg-slate-100 rounded-2xl" />
            ) : (
                <PremiumCard className="!p-0 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">{t("global_position.all_transactions")}</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500">{stats?.total || 0} {t("global_position.records")}</span>
                            <div className="relative" ref={columnMenuRef}>
                                <button
                                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                                    title="Configurar columnas"
                                >
                                    <Settings2 size={16} />
                                </button>
                                {showColumnMenu && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-2 min-w-[180px]">
                                        <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Columnas visibles</p>
                                        {(Object.keys(columnLabels) as ColumnKey[]).map(key => (
                                            <label key={key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[key]}
                                                    onChange={() => toggleColumn(key)}
                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                                                />
                                                <span className="text-xs font-medium text-slate-700">{columnLabels[key]}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {transactions.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10">
                                        <tr>
                                            {visibleColumns.date && (
                                                <th className="px-5 py-3 border-b border-slate-100">
                                                    <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                                                        {t("global_position.date")} <SortIcon field="date" />
                                                    </button>
                                                </th>
                                            )}
                                            {visibleColumns.friendlyDescription && (
                                                <th className="px-5 py-3 border-b border-slate-100">
                                                    <button onClick={() => handleSort("description")} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                                                        Desc. amigable <SortIcon field="description" />
                                                    </button>
                                                </th>
                                            )}
                                            {visibleColumns.description && (
                                                <th className="px-5 py-3 border-b border-slate-100">
                                                    {t("global_position.description")} (original)
                                                </th>
                                            )}
                                            {visibleColumns.category && (
                                                <th className="px-5 py-3 border-b border-slate-100">
                                                    <button onClick={() => handleSort("category")} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                                                        {t("global_position.category")} <SortIcon field="category" />
                                                    </button>
                                                </th>
                                            )}
                                            {visibleColumns.tags && (
                                                <th className="px-5 py-3 border-b border-slate-100">Tags</th>
                                            )}
                                            {visibleColumns.amount && (
                                                <th className="px-5 py-3 border-b border-slate-100 text-right">
                                                    <button onClick={() => handleSort("amount")} className="flex items-center gap-1 ml-auto hover:text-slate-600 transition-colors">
                                                        {t("global_position.amount")} <SortIcon field="amount" />
                                                    </button>
                                                </th>
                                            )}
                                            {visibleColumns.linkedTo && (
                                                <th className="px-5 py-3 border-b border-slate-100">{t("global_position.linked_to")}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {transactions.map((tx: ITransaction) => {
                                            const assetName = assets?.find(a => a._id === tx.linkedAssetId)?.name;
                                            const projectName = projects?.find(p => p._id === tx.linkedProjectId)?.name;
                                            return (
                                                <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                                    {visibleColumns.date && (
                                                        <td className="px-5 py-4 text-slate-500 font-medium">{tx.date}</td>
                                                    )}
                                                    {visibleColumns.friendlyDescription && (
                                                        <td className="px-5 py-4 font-bold text-slate-900">
                                                            {tx.friendlyDescription || tx.description}
                                                        </td>
                                                    )}
                                                    {visibleColumns.description && (
                                                        <td className="px-5 py-4 text-slate-500 text-xs max-w-[250px] truncate" title={tx.description}>
                                                            {tx.description}
                                                        </td>
                                                    )}
                                                    {visibleColumns.category && (
                                                        <td className="px-5 py-4">
                                                            <Badge variant="neutral">{tx.category}</Badge>
                                                        </td>
                                                    )}
                                                    {visibleColumns.tags && (
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-1">
                                                                {tx.tags?.map((tag: string) => <Badge key={tag} variant="info">{tag}</Badge>)}
                                                                {(!tx.tags || tx.tags.length === 0) && <span className="text-xs text-slate-400">—</span>}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.amount && (
                                                        <td className={`px-5 py-4 text-right font-mono font-bold ${tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}`}>
                                                            {formatCurrency(tx.amount)}
                                                        </td>
                                                    )}
                                                    {visibleColumns.linkedTo && (
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                {assetName && <span className="text-xs text-indigo-600 font-medium">🏠 {assetName}</span>}
                                                                {projectName && <span className="text-xs text-accent font-medium">🔨 {projectName}</span>}
                                                                {!assetName && !projectName && <span className="text-xs text-slate-400">—</span>}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <p className="text-xs font-medium text-slate-500">
                                    {t("global_position.page_of", { page: currentPage, total: totalPages })}
                                </p>
                                <Pagination
                                    page={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                icon={Activity}
                                title="Aún no hay movimientos bancarios"
                                description="Sube aquí tu primer extracto bancario en CSV u hoja de cálculo y la IA lo autoclasificará por ti."
                                actionLabel="Subir Extracto (IA)"
                                actionHref="/ingestion"
                            />
                        </div>
                    )}
                </PremiumCard>
            )}
        </main>
    );
}
