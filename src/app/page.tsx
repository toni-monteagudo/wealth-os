"use client";

import React from "react";
import KpiRow from "@/components/dashboard/KpiRow";
import ActiveAssetsList from "@/components/dashboard/ActiveAssetsList";
import OperationsHub from "@/components/dashboard/OperationsHub";
import ProjectVaultColumn from "@/components/dashboard/ProjectVaultColumn";

export default function DashboardPage() {
    return (
        <main className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {/* 4-Column KPI Row */}
            <KpiRow />

            {/* 3-Column main body grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">

                {/* Column 1: Active Assets */}
                <ActiveAssetsList />

                {/* Column 2: Operations Hub & Ghost Reserves */}
                <OperationsHub />

                {/* Column 3: Projects & Vault */}
                <ProjectVaultColumn />

            </div>
        </main>
    );
}
