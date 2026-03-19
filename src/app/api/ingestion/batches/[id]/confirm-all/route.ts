import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import IngestionBatch from "@/models/IngestionBatch";
import Transaction from "@/models/Transaction";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;

        // Parse deletion indices from the request body (sent by the client)
        let deletionIndices: Record<string, boolean> = {};
        try {
            const body = await req.json();
            deletionIndices = body?.deletionIndices || {};
        } catch {
            // No body or invalid JSON — no deletions
        }

        const batch = await IngestionBatch.findById(id);
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // Apply deletion overrides from client to the batch
        for (const [idxStr, shouldDelete] of Object.entries(deletionIndices)) {
            const idx = parseInt(idxStr, 10);
            if (idx >= 0 && idx < batch.transactions.length && shouldDelete) {
                (batch.transactions[idx] as any).pendingDeletion = true;
            }
        }

        // Get all unconfirmed transactions that are NOT pending deletion
        const toInsert = batch.transactions.filter(
            (t: any) => !t.confirmed && !t.pendingDeletion
        );

        if (toInsert.length > 0) {
            const transactionsToInsert = toInsert.map((tx: any) => ({
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
        }

        // Mark all non-deleted as confirmed
        for (const tx of batch.transactions) {
            if (!(tx as any).pendingDeletion) {
                (tx as any).confirmed = true;
            }
        }

        const confirmedCount = batch.transactions.filter(
            (t: any) => t.confirmed && !t.pendingDeletion
        ).length;

        batch.confirmedCount = confirmedCount;
        batch.status = "completed";
        batch.expiresAt = undefined;
        await batch.save();

        const deletedCount = batch.transactions.filter((t: any) => t.pendingDeletion).length;

        return NextResponse.json({
            confirmedCount: batch.confirmedCount,
            totalCount: batch.totalCount,
            deletedCount,
            status: batch.status,
        });
    } catch (error: any) {
        console.error("Confirm all error:", error);
        return NextResponse.json({ error: "Failed to confirm all transactions" }, { status: 500 });
    }
}
