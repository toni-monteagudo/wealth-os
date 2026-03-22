import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        const assetObjectId = new mongoose.Types.ObjectId(id);

        const [results] = await Transaction.aggregate([
            { $match: { linkedAssetId: assetObjectId } },
            {
                $addFields: {
                    yearStr: { $substr: ["$date", 0, 4] },
                    monthStr: { $substr: ["$date", 0, 7] },
                },
            },
            {
                $facet: {
                    global: [
                        {
                            $group: {
                                _id: null,
                                totalIncome: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
                                totalExpenses: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } },
                                transactionCount: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalIncome: 1,
                                totalExpenses: 1,
                                cashFlow: { $add: ["$totalIncome", "$totalExpenses"] },
                                transactionCount: 1,
                            },
                        },
                    ],
                    byYear: [
                        {
                            $group: {
                                _id: "$yearStr",
                                totalIncome: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
                                totalExpenses: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } },
                                transactionCount: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                totalIncome: 1,
                                totalExpenses: 1,
                                cashFlow: { $add: ["$totalIncome", "$totalExpenses"] },
                                transactionCount: 1,
                            },
                        },
                        { $sort: { _id: 1 } },
                    ],
                    byCategory: [
                        {
                            $group: {
                                _id: "$category",
                                total: { $sum: "$amount" },
                            },
                        },
                        { $sort: { total: 1 } },
                    ],
                    monthlyEvolution: [
                        {
                            $group: {
                                _id: "$monthStr",
                                income: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
                                expenses: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                month: "$_id",
                                income: 1,
                                expenses: 1,
                                cashFlow: { $add: ["$income", "$expenses"] },
                            },
                        },
                        { $sort: { month: 1 } },
                    ],
                },
            },
        ]);

        const global = results.global[0] || { totalIncome: 0, totalExpenses: 0, cashFlow: 0, transactionCount: 0 };

        const byYear: Record<string, { totalIncome: number; totalExpenses: number; cashFlow: number; transactionCount: number }> = {};
        for (const y of results.byYear) {
            byYear[y._id] = {
                totalIncome: y.totalIncome,
                totalExpenses: y.totalExpenses,
                cashFlow: y.cashFlow,
                transactionCount: y.transactionCount,
            };
        }

        const byCategory: Record<string, number> = {};
        for (const c of results.byCategory) {
            byCategory[c._id] = c.total;
        }

        return NextResponse.json({
            global,
            byYear,
            byCategory,
            monthlyEvolution: results.monthlyEvolution,
        });
    } catch (error) {
        console.error("Failed to compute asset financials:", error);
        return NextResponse.json({ error: "Failed to compute financials" }, { status: 500 });
    }
}
