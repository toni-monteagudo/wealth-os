import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import IngestionBatch from "@/models/IngestionBatch";
import Transaction from "@/models/Transaction";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;

        const batch = await IngestionBatch.findById(id);
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // Get all unconfirmed transactions
        const unconfirmed = batch.transactions.filter((t: any) => !t.confirmed);

        if (unconfirmed.length > 0) {
            const transactionsToInsert = unconfirmed.map((tx: any) => ({
                date: tx.date,
                description: tx.description,
                amount: tx.amount,
                category: tx.category,
                tags: tx.tags || [],
                linkedAssetId: tx.linkedAssetId || undefined,
                linkedProjectId: tx.linkedProjectId || undefined,
                batchId: id,
                status: "confirmed",
                source: "csv_import",
                processingTime: "Just now",
            }));

            await Transaction.insertMany(transactionsToInsert);

            // Mark all as confirmed
            for (const tx of batch.transactions) {
                (tx as any).confirmed = true;
            }
        }

        batch.confirmedCount = batch.totalCount;
        batch.status = "completed";
        batch.expiresAt = undefined;
        await batch.save();

        return NextResponse.json({
            confirmedCount: batch.confirmedCount,
            totalCount: batch.totalCount,
            status: batch.status,
        });
    } catch (error: any) {
        console.error("Confirm all error:", error);
        return NextResponse.json({ error: "Failed to confirm all transactions" }, { status: 500 });
    }
}
