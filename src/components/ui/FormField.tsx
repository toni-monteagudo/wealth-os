"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
    label: string;
    type?: string;
    options?: { label: string; value: string | number }[];
    error?: string;
}

export function FormField({ label, type = "text", options, error, className, ...props }: FormFieldProps) {
    return (
        <div className={cn("flex flex-col gap-1.5 mb-4", className)}>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {label}
            </label>

            {type === "select" ? (
                <select
                    className={cn(
                        "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all",
                        error && "border-rose-500 focus:ring-rose-500/20"
                    )}
                    {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
                >
                    {options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    className={cn(
                        "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all",
                        error && "border-rose-500 focus:ring-rose-500/20"
                    )}
                    {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                />
            )}

            {error && <span className="text-[10px] text-rose-500 font-medium">{error}</span>}
        </div>
    );
}
