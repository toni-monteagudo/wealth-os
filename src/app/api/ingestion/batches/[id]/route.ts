import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import IngestionBatch from "@/models/IngestionBatch";
import Transaction from "@/models/Transaction";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const batch = await IngestionBatch.findById(id);
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }
        return NextResponse.json(batch);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch batch" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid batch ID" }, { status: 400 });
        }

        const batch = await IngestionBatch.findById(id);
        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // Explicitly cast to ObjectId to ensure the query matches stored ObjectId values
        const objectId = new mongoose.Types.ObjectId(id);
        const deleteResult = await Transaction.deleteMany({ batchId: objectId });

        // Delete the batch itself
        await IngestionBatch.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            transactionsDeleted: deleteResult.deletedCount,
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
    }
}
