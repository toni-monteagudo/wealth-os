"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Globe, ArrowUpRight, ArrowDownRight, Activity, Search, X, ChevronUp, ChevronDown, Settings2, Trash2, Loader2, Pencil, PencilLine } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { ITransaction, IAsset, IProject, ICategory, ITransactionStats, IPaginatedResponse, IIngestionBatch } from "@/types";
import { useI18n } from "@/i18n/I18nContext";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImportToolbar } from "@/components/global-position/ImportToolbar";
import { BatchHistory } from "@/components/global-position/BatchHistory";
import { CategoriesManager } from "@/components/global-position/CategoriesManager";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 0] as const; // 0 = all

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
    const filterAmountType = searchParams.get("amountType") || "";
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
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

    // Transaction selection & deletion
    const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
    const [deleteModalTxs, setDeleteModalTxs] = useState<ITransaction[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Individual edit
    const [editTx, setEditTx] = useState<ITransaction | null>(null);
    const [editForm, setEditForm] = useState<Record<string, any>>({});
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Batch edit
    const [showBatchEdit, setShowBatchEdit] = useState(false);
    const [batchEditForm, setBatchEditForm] = useState<{ friendlyDescription: string; category: string; linkedValue: string }>({ friendlyDescription: "", category: "", linkedValue: "" });
    const [isSavingBatch, setIsSavingBatch] = useState(false);

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
        if (filterAmountType) params.set("amountType", filterAmountType);
        return params.toString();
    }, [filterAsset, filterProject, filterCategory, filterDateFrom, filterDateTo, filterSearch, filterAmountMin, filterAmountMax, filterAmountType]);

    // Data fetching
    const { data: stats, mutate: mutateStats } = useApi<ITransactionStats>(
        `/api/transactions/stats${apiQuery ? `?${apiQuery}` : ""}`
    );
    const { data: txResponse, loading: loadingTx, mutate: mutateTx } = useApi<IPaginatedResponse<ITransaction>>(
        `/api/transactions?paginated=true&limit=${pageSize}&page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}${apiQuery ? `&${apiQuery}` : ""}`
    );
    const { data: assets } = useApi<IAsset[]>("/api/assets");
    const { data: projects } = useApi<IProject[]>("/api/projects");
    const { data: categories, mutate: mutateCategories } = useApi<ICategory[]>("/api/categories");
    const { data: batches, mutate: mutateBatches } = useApi<IIngestionBatch[]>("/api/ingestion/batches");

    const transactions = txResponse?.data || [];
    const totalPages = txResponse?.pagination?.totalPages || 1;
    const totalIncome = stats?.totalIncome || 0;
    const totalExpenses = stats?.totalExpenses || 0;
    const netBalance = stats?.netBalance || 0;

    const hasActiveFilters = !!(filterAsset || filterProject || filterCategory || filterDateFrom || filterDateTo || filterSearch || filterAmountMin || filterAmountMax || filterAmountType);

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

    // Clear selection when page/filters change
    useEffect(() => {
        setSelectedTxIds(new Set());
    }, [currentPage, apiQuery]);

    const toggleSelectTx = useCallback((id: string) => {
        setSelectedTxIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedTxIds.size === transactions.length) {
            setSelectedTxIds(new Set());
        } else {
            setSelectedTxIds(new Set(transactions.map(tx => tx._id!)));
        }
    }, [transactions, selectedTxIds.size]);

    const isAllSelected = transactions.length > 0 && selectedTxIds.size === transactions.length;

    const openDeleteModal = useCallback((txs: ITransaction[]) => {
        setDeleteModalTxs(txs);
    }, []);

    const handleDeleteConfirmed = async () => {
        if (deleteModalTxs.length === 0) return;
        setIsDeleting(true);
        try {
            const ids = deleteModalTxs.map(tx => tx._id);
            const res = await fetch("/api/transactions/batch", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            });
            if (res.ok) {
                mutateTx();
                mutateStats();
                setSelectedTxIds(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id!));
                    return next;
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
            setDeleteModalTxs([]);
        }
    };

    const selectedTransactions = useMemo(() => {
        if (selectedTxIds.size === 0) return [];
        return transactions.filter(tx => selectedTxIds.has(tx._id!));
    }, [transactions, selectedTxIds]);

    // Batch management
    const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

    const handleDeleteBatch = async (batchId: string) => {
        if (!confirm("¿Eliminar este lote y todas sus transacciones importadas?")) return;
        setDeletingBatchId(batchId);
        try {
            const res = await fetch(`/api/ingestion/batches/${batchId}`, { method: "DELETE" });
            if (res.ok) {
                mutateBatches();
                mutateTx();
                mutateStats();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingBatchId(null);
        }
    };

    const handlePurgeAll = async () => {
        const res = await fetch("/api/ingestion/purge", { method: "DELETE" });
        if (res.ok) {
            mutateTx();
            mutateStats();
            mutateBatches();
        }
    };

    // Individual edit handlers
    const openEditModal = useCallback((tx: ITransaction) => {
        setEditTx(tx);
        setEditForm({
            date: tx.date,
            description: tx.description,
            friendlyDescription: tx.friendlyDescription || "",
            amount: tx.amount,
            category: tx.category,
            tags: (tx.tags || []).join(", "),
            linkedValue: tx.linkedAssetId ? `asset_${tx.linkedAssetId}` : tx.linkedProjectId ? `proj_${tx.linkedProjectId}` : "",
        });
    }, []);

    const handleSaveEdit = async () => {
        if (!editTx?._id) return;
        setIsSavingEdit(true);
        try {
            const linkedValue = editForm.linkedValue || "";
            const body: Record<string, any> = {
                date: editForm.date,
                description: editForm.description,
                friendlyDescription: editForm.friendlyDescription || undefined,
                amount: parseFloat(editForm.amount),
                category: editForm.category,
                tags: editForm.tags ? editForm.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
                linkedAssetId: linkedValue.startsWith("asset_") ? linkedValue.replace("asset_", "") : null,
                linkedProjectId: linkedValue.startsWith("proj_") ? linkedValue.replace("proj_", "") : null,
            };
            const res = await fetch(`/api/transactions/${editTx._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                mutateTx();
                mutateStats();
                setEditTx(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingEdit(false);
        }
    };

    // Batch edit handlers
    const openBatchEditModal = useCallback(() => {
        setBatchEditForm({ friendlyDescription: "", category: "", linkedValue: "" });
        setShowBatchEdit(true);
    }, []);

    const handleSaveBatchEdit = async () => {
        if (selectedTxIds.size === 0) return;
        setIsSavingBatch(true);
        try {
            const updates: Record<string, any> = {};
            if (batchEditForm.friendlyDescription) updates.friendlyDescription = batchEditForm.friendlyDescription;
            if (batchEditForm.category) updates.category = batchEditForm.category;
            if (batchEditForm.linkedValue) {
                if (batchEditForm.linkedValue === "__none__") {
                    updates.linkedAssetId = null;
                    updates.linkedProjectId = null;
                } else if (batchEditForm.linkedValue.startsWith("asset_")) {
                    updates.linkedAssetId = batchEditForm.linkedValue.replace("asset_", "");
                    updates.linkedProjectId = null;
                } else if (batchEditForm.linkedValue.startsWith("proj_")) {
                    updates.linkedProjectId = batchEditForm.linkedValue.replace("proj_", "");
                    updates.linkedAssetId = null;
                }
            }
            if (Object.keys(updates).length === 0) {
                setShowBatchEdit(false);
                return;
            }
            const res = await fetch("/api/transactions/batch", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedTxIds), updates }),
            });
            if (res.ok) {
                mutateTx();
                mutateStats();
                setShowBatchEdit(false);
                setSelectedTxIds(new Set());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingBatch(false);
        }
    };

    const handleUploadComplete = () => {
        mutateTx();
        mutateStats();
        mutateBatches();
    };

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

            {/* Import Toolbar */}
            <ImportToolbar
                batches={batches || []}
                onUploadComplete={handleUploadComplete}
            />

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

                    {/* Amount Type */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</label>
                        <select
                            value={filterAmountType}
                            onChange={(e) => updateParams({ amountType: e.target.value })}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">Todos</option>
                            <option value="income">Ingresos</option>
                            <option value="expense">Gastos</option>
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
                            {selectedTxIds.size > 0 && (
                                <>
                                    <button
                                        onClick={openBatchEditModal}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                        <PencilLine size={12} /> Editar ({selectedTxIds.size})
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(selectedTransactions)}
                                        className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                        <Trash2 size={12} /> Eliminar ({selectedTxIds.size})
                                    </button>
                                </>
                            )}
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
                                            <th className="px-3 py-3 border-b border-slate-100 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={toggleSelectAll}
                                                    className="size-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                                                />
                                            </th>
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
                                            <th className="px-3 py-3 border-b border-slate-100 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {transactions.map((tx: ITransaction) => {
                                            const assetName = assets?.find(a => a._id === tx.linkedAssetId)?.name;
                                            const projectName = projects?.find(p => p._id === tx.linkedProjectId)?.name;
                                            return (
                                                <tr key={tx._id} className={`hover:bg-slate-50 transition-colors ${selectedTxIds.has(tx._id!) ? "bg-emerald-50/30" : ""}`}>
                                                    <td className="px-3 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTxIds.has(tx._id!)}
                                                            onChange={() => toggleSelectTx(tx._id!)}
                                                            className="size-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                                                        />
                                                    </td>
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
                                                    <td className="px-3 py-4">
                                                        <div className="flex items-center gap-0.5">
                                                            <button
                                                                onClick={() => openEditModal(tx)}
                                                                className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-200 transition-colors"
                                                                title="Editar transacción"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal([tx])}
                                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                                                title="Eliminar transacción"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-slate-500">
                                        {pageSize === 0
                                            ? `${txResponse?.pagination?.total || 0} registros`
                                            : t("global_position.page_of", { page: currentPage, total: totalPages })
                                        }
                                    </p>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => updateParams({ pageSize: e.target.value, page: "1" })}
                                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/20"
                                    >
                                        {PAGE_SIZE_OPTIONS.map(size => (
                                            <option key={size} value={size}>
                                                {size === 0 ? "Todos" : `${size} por página`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {pageSize !== 0 && (
                                    <Pagination
                                        page={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                icon={Activity}
                                title="Aún no hay movimientos bancarios"
                                description="Usa el botón 'Subir Extractos' de arriba para importar tu primer extracto bancario en CSV u hoja de cálculo. La IA lo autoclasificará por ti."
                            />
                        </div>
                    )}
                </PremiumCard>
            )}

            {/* Batch History & Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BatchHistory
                    batches={batches || []}
                    onDelete={handleDeleteBatch}
                    onPurge={handlePurgeAll}
                    onView={(batchId) => router.push(`/global-position/detail?batchId=${batchId}&page=1`)}
                    deletingBatchId={deletingBatchId}
                />
                <CategoriesManager
                    categories={categories || []}
                    onMutate={mutateCategories}
                />
            </div>

            {/* Delete confirmation modal */}
            <Modal
                isOpen={deleteModalTxs.length > 0}
                onClose={() => !isDeleting && setDeleteModalTxs([])}
                title={`Eliminar ${deleteModalTxs.length === 1 ? "transacción" : `${deleteModalTxs.length} transacciones`}`}
                className="max-w-2xl"
            >
                <p className="text-sm text-slate-600 mb-4">
                    {deleteModalTxs.length === 1
                        ? "¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer."
                        : `¿Estás seguro de que quieres eliminar estas ${deleteModalTxs.length} transacciones? Esta acción no se puede deshacer.`
                    }
                </p>

                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6 max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Fecha</th>
                                <th className="px-4 py-2">Descripción</th>
                                <th className="px-4 py-2">Categoría</th>
                                <th className="px-4 py-2 text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {deleteModalTxs.map(tx => (
                                <tr key={tx._id}>
                                    <td className="px-4 py-2 text-xs text-slate-500 font-mono whitespace-nowrap">{tx.date}</td>
                                    <td className="px-4 py-2 text-xs font-medium text-slate-800 truncate max-w-[200px]">
                                        {tx.friendlyDescription || tx.description}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Badge variant="neutral">{tx.category}</Badge>
                                    </td>
                                    <td className={`px-4 py-2 text-xs text-right font-mono font-bold whitespace-nowrap ${tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}`}>
                                        {formatCurrency(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => setDeleteModalTxs([])}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDeleteConfirmed}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {isDeleting ? "Eliminando..." : "Eliminar permanentemente"}
                    </button>
                </div>
            </Modal>
            {/* Individual edit modal */}
            <Modal
                isOpen={!!editTx}
                onClose={() => !isSavingEdit && setEditTx(null)}
                title="Editar transacción"
                className="max-w-lg"
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
                        <input
                            type="date"
                            value={editForm.date || ""}
                            onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción (original)</label>
                        <input
                            type="text"
                            value={editForm.description || ""}
                            onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción amigable</label>
                        <input
                            type="text"
                            value={editForm.friendlyDescription || ""}
                            onChange={(e) => setEditForm(f => ({ ...f, friendlyDescription: e.target.value }))}
                            placeholder="Opcional"
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Importe</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editForm.amount ?? ""}
                                onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))}
                                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                            <select
                                value={editForm.category || ""}
                                onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
                                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                            >
                                {categories?.map(c => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags (separados por coma)</label>
                        <input
                            type="text"
                            value={editForm.tags || ""}
                            onChange={(e) => setEditForm(f => ({ ...f, tags: e.target.value }))}
                            placeholder="tag1, tag2"
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vincular a Activo/Proyecto</label>
                        <select
                            value={editForm.linkedValue || ""}
                            onChange={(e) => setEditForm(f => ({ ...f, linkedValue: e.target.value }))}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">-- Suelto --</option>
                            <optgroup label="Activos">
                                {assets?.map(a => (
                                    <option key={a._id} value={`asset_${a._id}`}>{a.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Proyectos">
                                {projects?.map(p => (
                                    <option key={p._id} value={`proj_${p._id}`}>{p.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={() => setEditTx(null)}
                            disabled={isSavingEdit}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                            {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Batch edit modal */}
            <Modal
                isOpen={showBatchEdit}
                onClose={() => !isSavingBatch && setShowBatchEdit(false)}
                title={`Editar ${selectedTxIds.size} transacciones`}
                className="max-w-lg"
            >
                <p className="text-sm text-slate-500 mb-5">
                    Solo rellena los campos que quieras modificar. Los campos vacíos no se cambiarán.
                </p>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción amigable</label>
                        <input
                            type="text"
                            value={batchEditForm.friendlyDescription}
                            onChange={(e) => setBatchEditForm(f => ({ ...f, friendlyDescription: e.target.value }))}
                            placeholder="Dejar vacío para no cambiar"
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                        <select
                            value={batchEditForm.category}
                            onChange={(e) => setBatchEditForm(f => ({ ...f, category: e.target.value }))}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">-- No cambiar --</option>
                            {categories?.map(c => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vincular a Activo/Proyecto</label>
                        <select
                            value={batchEditForm.linkedValue}
                            onChange={(e) => setBatchEditForm(f => ({ ...f, linkedValue: e.target.value }))}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                            <option value="">-- No cambiar --</option>
                            <option value="__none__">Desvincular (suelto)</option>
                            <optgroup label="Activos">
                                {assets?.map(a => (
                                    <option key={a._id} value={`asset_${a._id}`}>{a.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Proyectos">
                                {projects?.map(p => (
                                    <option key={p._id} value={`proj_${p._id}`}>{p.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={() => setShowBatchEdit(false)}
                            disabled={isSavingBatch}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveBatchEdit}
                            disabled={isSavingBatch}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSavingBatch ? <Loader2 size={14} className="animate-spin" /> : <PencilLine size={14} />}
                            {isSavingBatch ? "Guardando..." : `Aplicar a ${selectedTxIds.size} registros`}
                        </button>
                    </div>
                </div>
            </Modal>
        </main>
    );
}
