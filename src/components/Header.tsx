"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Wallet, Settings } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();
    const { t, locale, setLocale } = useI18n();

    const navLinks = [
        { href: "/", label: t("nav.dashboard") },
        { href: "/activos", label: t("nav.assets") },
        { href: "/proyectos", label: t("nav.projects") },
        { href: "/documentos", label: t("nav.documents") },
        { href: "/prestamos", label: t("nav.loans") },
        { href: "/posicion-global", label: t("nav.global_position") },
        { href: "/ingesta", label: t("nav.ai_ingestion") },
    ];

    return (
        <header className="glass-overlay sticky top-0 z-50 w-full border-b border-slate-200 px-6 py-4">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center shadow-lg shadow-accent/20">
                            <Wallet className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Wealth OS</h1>
                            <p className="text-[10px] text-slate-500 font-bold tracking-[0.1em] mt-0.5 uppercase">Mission Control</p>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                        {navLinks.map((link) => {
                            const isActive = link.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                                        isActive
                                            ? "bg-white shadow-sm text-slate-900"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-white/50 font-medium"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-full px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                        <Search className="text-slate-400 mr-2" size={18} />
                        <input
                            className="bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none w-full p-0"
                            placeholder={t("nav.search_placeholder")}
                            type="text"
                        />
                        <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-200">⌘K</span>
                    </div>

                    <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as "es" | "en")}
                        className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2 py-1 outline-none"
                    >
                        <option value="es">ES</option>
                        <option value="en">EN</option>
                    </select>

                    <button className="size-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2.5 size-2 bg-rose-500 rounded-full border-2 border-white"></span>
                    </button>

                    <Link href="/configuracion" className="size-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors">
                        <Settings size={20} />
                    </Link>

                    <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden ring-2 ring-white">
                        <img
                            alt="User"
                            className="object-cover w-full h-full"
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
