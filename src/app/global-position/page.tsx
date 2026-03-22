import React, { Suspense } from "react";
import GlobalPositionClient from "./GlobalPositionClient";

export default function GlobalPositionPage() {
    return (
        <Suspense fallback={<div className="animate-pulse h-64 bg-slate-100 rounded-2xl m-8" />}>
            <GlobalPositionClient />
        </Suspense>
    );
}
