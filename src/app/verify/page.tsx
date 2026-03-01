"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No se encontró ningún token de verificación en la URL.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch("/api/auth/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                } else {
                    setStatus("error");
                    setMessage(data.error || "Ocurrió un error al verificar tu cuenta.");
                }
            } catch (error) {
                setStatus("error");
                setMessage("Error de conexión. Inténtalo más tarde.");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl shadow-slate-200/50 border border-slate-100 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8">

                {status === "loading" && (
                    <>
                        <Loader2 className="animate-spin text-accent mb-6" size={48} />
                        <h1 className="text-xl font-bold text-slate-900">Verificando Cuenta...</h1>
                        <p className="text-sm text-slate-500 mt-2">Estamos validando tu correo de forma segura.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle2 className="text-emerald-500 mb-6" size={64} />
                        <h1 className="text-2xl font-bold text-slate-900">¡Verificación Exitosa!</h1>
                        <p className="text-sm text-slate-500 mt-2 mb-8">Tu cuenta de Administrador ha sido confirmada. Ya puedes acceder al sistema.</p>
                        <Link
                            href="/login"
                            className="bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl w-full flex items-center justify-center hover:bg-slate-800 transition-all"
                        >
                            Ir al Login
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <AlertCircle className="text-rose-500 mb-6" size={64} />
                        <h1 className="text-2xl font-bold text-slate-900">Error de Verificación</h1>
                        <p className="text-sm text-slate-500 mt-2 mb-8">{message}</p>
                        <Link
                            href="/login"
                            className="bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl w-full flex items-center justify-center hover:bg-slate-800 transition-all"
                        >
                            Volver al Inicio
                        </Link>
                    </>
                )}

            </div>
        </main>
    );
}
