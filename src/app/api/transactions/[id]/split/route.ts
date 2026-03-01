import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const { splits } = await req.json(); // Array of {category, amount}

        const transaction = await Transaction.findByIdAndUpdate(
            id,
            { splits, status: "confirmed" },
            { new: true }
        );

        if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: "Failed to split transaction" }, { status: 400 });
    }
}
