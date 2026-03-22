import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function DELETE(req: Request) {
    await dbConnect();
    try {
        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Expected a non-empty array of transaction IDs" }, { status: 400 });
        }

        const result = await Transaction.deleteMany({ _id: { $in: ids } });
        return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    } catch (error: any) {
        console.error("Batch delete error:", error);
        return NextResponse.json({ error: "Failed to delete transactions" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    await dbConnect();
    try {
        const { ids, updates } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Expected a non-empty array of transaction IDs" }, { status: 400 });
        }

        if (!updates || typeof updates !== "object") {
            return NextResponse.json({ error: "Expected an updates object" }, { status: 400 });
        }

        const result = await Transaction.updateMany(
            { _id: { $in: ids } },
            { $set: updates }
        );

        return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (error: any) {
        console.error("Batch update error:", error);
        return NextResponse.json({ error: "Failed to update transactions" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: "Expected an array of transactions" }, { status: 400 });
        }

        // Add default status for directly imported / confirmed transactions
        const transactionsToInsert = body.map(tx => ({
            ...tx,
            status: "confirmed"
        }));

        const result = await Transaction.insertMany(transactionsToInsert);
        return NextResponse.json({ success: true, count: result.length }, { status: 201 });
    } catch (error: any) {
        console.error("Batch insert error:", error);
        return NextResponse.json({ error: "Failed to insert batch transactions" }, { status: 500 });
    }
}
