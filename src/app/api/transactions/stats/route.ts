import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { buildTransactionQuery } from "@/lib/transactionQueryBuilder";

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const query = buildTransactionQuery(searchParams);

        const result = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    needsReviewCount: { $sum: { $cond: [{ $eq: ["$status", "needs_review"] }, 1, 0] } },
                    confirmedCount: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
                    totalIncome: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
                    totalExpenses: { $sum: { $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0] } },
                },
            },
        ]);

        const stats = result[0] || {
            total: 0,
            needsReviewCount: 0,
            confirmedCount: 0,
            totalIncome: 0,
            totalExpenses: 0,
        };

        return NextResponse.json({
            total: stats.total,
            needsReviewCount: stats.needsReviewCount,
            confirmedCount: stats.confirmedCount,
            totalIncome: stats.totalIncome,
            totalExpenses: stats.totalExpenses,
            netBalance: stats.totalIncome - stats.totalExpenses,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch transaction stats" }, { status: 500 });
    }
}
