import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 50;

        const query = status ? { status } : {};

        const transactions = await Transaction.find(query)
            .sort({ date: -1, createdAt: -1 })
            .limit(limit);

        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const transaction = await Transaction.create({ ...body, source: "manual" });
        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 400 });
    }
}
