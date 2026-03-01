import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

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
