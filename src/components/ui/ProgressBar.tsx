"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ProgressBar({
    progress,
    className,
    colorClass = "bg-primary",
}: {
    progress: number;
    className?: string;
    colorClass?: string;
}) {
    const safeProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={cn("h-1.5 w-full bg-slate-100 rounded-full overflow-hidden", className)}>
            <div
                className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                style={{ width: `${safeProgress}%` }}
            />
        </div>
    );
}
