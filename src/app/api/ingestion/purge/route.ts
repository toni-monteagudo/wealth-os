import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import IngestionBatch from "@/models/IngestionBatch";
import Transaction from "@/models/Transaction";

export async function DELETE() {
    await dbConnect();
    try {
        const [txResult, batchResult] = await Promise.all([
            Transaction.deleteMany({}),
            IngestionBatch.deleteMany({}),
        ]);

        return NextResponse.json({
            success: true,
            transactionsDeleted: txResult.deletedCount,
            batchesDeleted: batchResult.deletedCount,
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to purge data" }, { status: 500 });
    }
}
