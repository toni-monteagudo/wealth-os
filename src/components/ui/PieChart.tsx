"use client";

import React from "react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DataItem {
    name: string;
    value: number;
    color: string;
}

export function PieChart({
    data,
    totalLabel = "TOTAL",
    totalValue,
}: {
    data: DataItem[];
    totalLabel?: string;
    totalValue?: string;
}) {
    return (
        <div className="relative h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => `$${value?.toLocaleString() || 0}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                </RechartsPie>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalLabel}</span>
                <span className="text-lg font-bold text-slate-900">{totalValue}</span>
            </div>
        </div>
    );
}
