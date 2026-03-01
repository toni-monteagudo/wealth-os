"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Wait, I didn't create utils yet, will do it inline or create it

export function PremiumCard({
    children,
    className,
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "premium-card p-5 relative overflow-hidden group",
                onClick && "cursor-pointer hover:border-accent hover:shadow-md",
                className
            )}
        >
            {children}
        </div>
    );
}
