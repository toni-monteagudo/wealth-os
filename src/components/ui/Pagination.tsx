"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Show up to 5 page numbers centered around current page
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = Math.max(1, end - 4); i <= end; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-center gap-1.5">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft size={16} />
            </button>

            {pages[0] > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className="size-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        1
                    </button>
                    {pages[0] > 2 && <span className="text-xs text-slate-400 px-1">...</span>}
                </>
            )}

            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`size-8 rounded-lg text-xs font-bold transition-colors ${
                        p === page
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:bg-slate-100"
                    }`}
                >
                    {p}
                </button>
            ))}

            {pages[pages.length - 1] < totalPages && (
                <>
                    {pages[pages.length - 1] < totalPages - 1 && <span className="text-xs text-slate-400 px-1">...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className="size-8 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
