"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Toggle({
    checked,
    onChange,
    label,
    className,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    className?: string;
}) {
    return (
        <label className={cn("inline-flex items-center cursor-pointer", className)}>
            {label && <span className="mr-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">{label}</span>}
            <div className="relative">
                <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-accent"></div>
            </div>
        </label>
    );
}
