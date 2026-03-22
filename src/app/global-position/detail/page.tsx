import React, { Suspense } from "react";
import BatchDetailClient from "./BatchDetailClient";

export default function BatchDetailPage() {
    return (
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
            <Suspense fallback={<div className="text-center py-12 text-slate-400 font-medium">Cargando...</div>}>
                <BatchDetailClient />
            </Suspense>
        </main>
    );
}
