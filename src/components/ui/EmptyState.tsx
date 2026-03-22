import React from "react";
import { Link } from "lucide-react";
import NextLink from "next/link";
import { PremiumCard } from "./PremiumCard";

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    actionObj?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction, actionObj }: EmptyStateProps) {
    return (
        <PremiumCard className="flex flex-col items-center justify-center text-center py-16 px-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-slate-50/50 -z-10 group-hover:bg-slate-50/80 transition-colors" />
            <div className="absolute w-64 h-64 bg-accent/5 rounded-full blur-3xl -top-10 -right-10" />

            <div className="size-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-6 group-hover:scale-110 group-hover:text-accent group-hover:bg-accent/10 transition-all duration-500 shadow-sm border border-slate-200 group-hover:border-accent/20">
                <Icon size={36} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                {description}
            </p>

            {actionObj ? actionObj : onAction && actionLabel ? (
                <button
                    onClick={onAction}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-slate-900/10 flex items-center gap-2"
                >
                    {actionLabel}
                </button>
            ) : actionHref && actionLabel ? (
                <NextLink
                    href={actionHref}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-slate-900/10 flex items-center gap-2"
                >
                    {actionLabel}
                </NextLink>
            ) : null}
        </PremiumCard>
    );
}
