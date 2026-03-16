import { NextResponse } from "next/server";
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

        // Delete all transactions that belong to this batch
        const deleteResult = await Transaction.deleteMany({ batchId: id });

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
