import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import IngestionBatch from "@/models/IngestionBatch";

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { transactions, fileName } = await req.json();

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return NextResponse.json({ error: "Expected a non-empty array of transactions" }, { status: 400 });
        }

        const batch = await IngestionBatch.create({
            fileName: fileName || undefined,
            transactions: transactions.map(tx => ({ ...tx, confirmed: false })),
            totalCount: transactions.length,
            confirmedCount: 0,
            status: "in_review",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL for abandoned batches
        });

        return NextResponse.json({ batchId: batch._id, totalCount: batch.totalCount }, { status: 201 });
    } catch (error: any) {
        console.error("Create batch error:", error);
        return NextResponse.json({ error: "Failed to create ingestion batch" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // "in_review", "completed", or null for all

        const filter: any = {};
        if (status) filter.status = status;

        const batches = await IngestionBatch.find(filter)
            .select("_id fileName totalCount confirmedCount status createdAt")
            .sort({ createdAt: -1 });

        return NextResponse.json(batches);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
    }
}
