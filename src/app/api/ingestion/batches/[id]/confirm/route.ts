import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import IngestionBatch from "@/models/IngestionBatch";
import Transaction from "@/models/Transaction";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const { pageIndex, pageSize, transactions } = await req.json();

        const batch = await IngestionBatch.findById(id);
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // Insert confirmed transactions into the real Transaction collection with batchId
        const transactionsToInsert = transactions.map((tx: any) => ({
            date: tx.date,
            description: tx.description,
            friendlyDescription: tx.friendlyDescription || undefined,
            amount: tx.amount,
            category: tx.category,
            tags: tx.tags || [],
            linkedAssetId: tx.linkedAssetId || undefined,
            linkedProjectId: tx.linkedProjectId || undefined,
            batchId: new mongoose.Types.ObjectId(id),
            status: "confirmed",
            source: "csv_import",
            processingTime: "Just now",
        }));

        await Transaction.insertMany(transactionsToInsert);

        // Mark the page's transactions as confirmed in the batch
        const startIdx = pageIndex * pageSize;
        for (let i = 0; i < transactions.length; i++) {
            const batchIdx = startIdx + i;
            if (batchIdx < batch.transactions.length) {
                batch.transactions[batchIdx].confirmed = true;
                batch.transactions[batchIdx].category = transactions[i].category;
                batch.transactions[batchIdx].friendlyDescription = transactions[i].friendlyDescription;
                batch.transactions[batchIdx].linkedAssetId = transactions[i].linkedAssetId;
                batch.transactions[batchIdx].linkedProjectId = transactions[i].linkedProjectId;
            }
        }

        batch.confirmedCount = batch.transactions.filter((t: any) => t.confirmed).length;

        if (batch.confirmedCount >= batch.totalCount) {
            batch.status = "completed";
            batch.expiresAt = undefined; // Prevent TTL deletion for completed batches
        }

        await batch.save();

        return NextResponse.json({
            confirmedCount: batch.confirmedCount,
            totalCount: batch.totalCount,
            status: batch.status,
        });
    } catch (error: any) {
        console.error("Confirm batch page error:", error);
        return NextResponse.json({ error: "Failed to confirm batch page" }, { status: 500 });
    }
}
