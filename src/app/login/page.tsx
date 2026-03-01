"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;

        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Credenciales incorrectas. (Pista: admin / admin)");
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 -skew-y-6 transform origin-top-left -z-10 shadow-2xl"></div>
            <div className="absolute top-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-20 left-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl -z-10"></div>

            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-8 relative overflow-hidden">

                    {/* Header */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="size-16 rounded-2xl bg-gradient-to-br from-accent to-emerald-500 flex items-center justify-center shadow-lg shadow-accent/30 mb-2">
                            <Wallet className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bienvenido de nuevo</h1>
                        <p className="text-sm font-medium text-slate-500">Inicia sesión en tu Wealth OS Mission Control.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Usuario</label>
                            <input
                                name="username"
                                type="text"
                                disabled={loading}
                                placeholder="Introduce tu usuario"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
                            <input
                                name="password"
                                type="password"
                                disabled={loading}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all font-medium"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-lg text-center mt-2 animate-in fade-in">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} /> Validando...
                                </>
                            ) : (
                                <>
                                    Acceder al Dashboard <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer note */}
                    <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest mt-4">
                        Acceso seguro encriptado
                    </p>
                </div>
            </div>
        </main>
    );
}
