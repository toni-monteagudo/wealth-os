"use client";

import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

export function Badge({
    children,
    variant = "neutral",
    className,
}: {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}) {
    const variants = {
        success: "bg-emerald-50 text-emerald-600 border-emerald-100",
        warning: "bg-amber-50 text-amber-600 border-amber-100",
        danger: "bg-rose-50 text-rose-600 border-rose-100",
        info: "bg-blue-50 text-blue-600 border-blue-100",
        brand: "bg-indigo-50 text-indigo-700 border-indigo-100",
        neutral: "bg-slate-50 text-slate-600 border-slate-200",
    };

    return (
        <span
            className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider inline-flex items-center",
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
