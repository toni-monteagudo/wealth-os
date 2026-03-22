"use client";

import React, { useState } from "react";
import { Tag, Plus, X } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ICategory } from "@/types";

interface CategoriesManagerProps {
    categories: ICategory[];
    onMutate: () => void;
}

export function CategoriesManager({ categories, onMutate }: CategoriesManagerProps) {
    const [expanded, setExpanded] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            setNewCategoryName("");
            onMutate();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
            onMutate();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <PremiumCard>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between"
            >
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Tag size={12} className="inline mr-1" /> Categorías ({categories?.length || 0})
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{expanded ? "Ocultar" : "Mostrar"}</span>
            </button>

            {expanded && (
                <div className="mt-4">
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                            placeholder="Nueva categoría..."
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase"
                        />
                        <button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim()}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                        {categories?.map(cat => (
                            <span key={cat._id} className="group inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-600 uppercase">
                                {cat.name}
                                <button
                                    onClick={() => handleDeleteCategory(cat._id!)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </PremiumCard>
    );
}
