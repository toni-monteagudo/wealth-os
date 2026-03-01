"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Wallet, LogOut, Settings, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t, locale, setLocale } = useI18n();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

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

                    {session && (
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
                    )}
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

                    {session && (
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden ring-2 ring-white hover:ring-accent/20 transition-all focus:outline-none"
                            >
                                <img
                                    alt="User"
                                    className="object-cover w-full h-full"
                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                            <p className="text-sm font-bold text-slate-900">{session.user?.name}</p>
                                            <p className="text-xs font-medium text-slate-500 truncate">{session.user?.email}</p>
                                        </div>
                                        <div className="p-1.5 flex flex-col gap-0.5">
                                            <Link
                                                href="/configuracion"
                                                onClick={() => setDropdownOpen(false)}
                                                className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2"
                                            >
                                                <Settings size={16} /> Configuración Global
                                            </Link>
                                            <button
                                                onClick={() => signOut({ callbackUrl: '/login' })}
                                                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
                                            >
                                                <LogOut size={16} /> Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
