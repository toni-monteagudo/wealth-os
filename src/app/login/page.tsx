"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState<{ link: string, show: boolean }>({ link: '', show: false });

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch("/api/auth/setup-status");
                const data = await res.json();
                if (!data.hasAdmin) {
                    setIsSetupMode(true);
                }
            } catch (err) {
                console.error("Failed to check setup status", err);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, []);

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
            setError(res.error);
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
        }
    };

    const handleSetup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await fetch("/api/auth/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create admin");

            setVerificationSuccess({
                show: true,
                link: `/verify?token=${data.verificationToken}`
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !isSetupMode) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-accent" size={32} /></div>;
    }

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
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            {isSetupMode ? "Configuración Inicial" : "Bienvenido de nuevo"}
                        </h1>
                        <p className="text-sm font-medium text-slate-500">
                            {isSetupMode ? "Crea la cuenta de Administrador maestra." : "Inicia sesión en tu Wealth OS Mission Control."}
                        </p>
                    </div>

                    {verificationSuccess.show ? (
                        <div className="flex flex-col items-center gap-4 text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <CheckCircle2 className="text-emerald-500" size={48} />
                            <div>
                                <h3 className="text-emerald-900 font-bold mb-1">¡Cuenta Creada!</h3>
                                <p className="text-emerald-700 text-sm">Se ha enviado un correo para verificar tu cuenta.</p>
                            </div>
                            <div className="mt-4 p-4 bg-white/60 border border-emerald-200 rounded-xl">
                                <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wide">🔗 Enlace Simulado (Modo Dev)</p>
                                <a href={verificationSuccess.link} className="text-sm font-bold text-accent hover:underline break-all">
                                    Haz clic aquí para verificar
                                </a>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={isSetupMode ? handleSetup : handleLogin} className="flex flex-col gap-4">
                            {isSetupMode && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nombre</label>
                                    <input
                                        name="name"
                                        type="text"
                                        disabled={loading}
                                        placeholder="Tu nombre real"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico</label>
                                <input
                                    name={isSetupMode ? "email" : "username"}
                                    type="email"
                                    disabled={loading}
                                    placeholder="correo@ejemplo.com"
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
                                        <Loader2 className="animate-spin" size={18} /> Procesando...
                                    </>
                                ) : (
                                    <>
                                        {isSetupMode ? "Crear Cuenta Maestra" : "Acceder al Dashboard"} <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer note */}
                    <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest mt-4">
                        Acceso seguro encriptado
                    </p>
                </div>
            </div>
        </main>
    );
}
