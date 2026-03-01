import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const transaction = await Transaction.findById(id);
        if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const transaction = await Transaction.findByIdAndUpdate(id, body, { new: true });
        if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const transaction = await Transaction.findByIdAndDelete(id);
        if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
    }
}
