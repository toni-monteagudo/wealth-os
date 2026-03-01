import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Reserve from "@/models/Reserve";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const transaction = await Transaction.findById(id);
        if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

        // Mark as confirmed
        transaction.status = "confirmed";
        await transaction.save();

        // Auto-allocate ghost money if it's income (positive amount)
        if (transaction.amount > 0) {
            const reserves = await Reserve.find({ allocationPercent: { $gt: 0 } });

            for (const reserve of reserves) {
                const allocAmount = transaction.amount * (reserve.allocationPercent / 100);
                reserve.balance += allocAmount;
                await reserve.save();
            }
        }

        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: "Failed to confirm transaction" }, { status: 400 });
    }
}
