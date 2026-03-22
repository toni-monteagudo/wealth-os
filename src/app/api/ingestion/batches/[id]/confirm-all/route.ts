import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import IngestionBatch from "@/models/IngestionBatch";
import Transaction from "@/models/Transaction";

function validObjectId(value: unknown): string | undefined {
    if (!value || typeof value !== "string") return undefined;
    return mongoose.Types.ObjectId.isValid(value) ? value : undefined;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;

        const batch = await IngestionBatch.findById(id);
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // Get all unconfirmed transactions
        const toInsert = batch.transactions.filter(
            (t: any) => !t.confirmed
        );

        if (toInsert.length > 0) {
            const transactionsToInsert = toInsert.map((tx: any) => ({
                date: tx.date,
                description: tx.description,
                friendlyDescription: tx.friendlyDescription || undefined,
                amount: tx.amount,
                category: tx.category,
                tags: tx.tags || [],
                linkedAssetId: validObjectId(tx.linkedAssetId),
                linkedProjectId: validObjectId(tx.linkedProjectId),
                batchId: new mongoose.Types.ObjectId(id),
                status: "confirmed",
                source: "csv_import",
                processingTime: "Just now",
            }));

            await Transaction.insertMany(transactionsToInsert);
        }

        // Mark all as confirmed
        for (const tx of batch.transactions) {
            (tx as any).confirmed = true;
        }

        batch.confirmedCount = batch.transactions.length;
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
