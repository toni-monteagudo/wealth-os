import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";
import Liability from "@/models/Liability";
import Transaction from "@/models/Transaction";
import { calculateRemainingBalance } from "@/lib/utils";

export async function GET() {
    await dbConnect();

    try {
        const assets = await Asset.find({});
        const liabilities = await Liability.find({});
        const transactions = await Transaction.find({});

        const totalAssets = assets.reduce((acc, curr) => acc + curr.value, 0);
        const totalDebt = liabilities.reduce((acc, curr) => acc + calculateRemainingBalance(curr), 0);
        const netWorth = totalAssets - totalDebt;

        // LTV = Debt / Value
        const ltvRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

        // Calculate MRR / Revenues (Simulated for 月 FCF via Assets)
        const saasAssets = assets.filter(a => a.type === "business");
        const mrrTotal = saasAssets.reduce((acc, curr) => acc + (curr.mrr || 0), 0);

        // Actual FCF Calculation
        const fcfIn = transactions.filter(tx => tx.amount > 0).reduce((acc, curr) => acc + curr.amount, 0);
        const fcfOut = transactions.filter(tx => tx.amount < 0).reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
        const monthlyFcf = fcfIn - fcfOut;

        // FI Goal Target $3.5M
        const fiTarget = 3500000;
        const fiGoalProgress = Math.min((netWorth / fiTarget) * 100, 100);

        return NextResponse.json({
            netWorth,
            netWorthGrowth: 0,
            ltvRatio: parseFloat(ltvRatio.toFixed(1)),
            monthlyFcf,
            monthlyFcfGrowth: 0,
            fcfIn,
            fcfOut,
            fiGoalProgress: parseFloat(fiGoalProgress.toFixed(1))
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 });
    }
}
