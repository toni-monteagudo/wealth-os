import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Liability from "@/models/Liability";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const liability = await Liability.findById(id).populate("linkedAssetId");
        if (!liability) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(liability);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch liability" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const liability = await Liability.findByIdAndUpdate(id, body, { new: true }).populate("linkedAssetId");
        if (!liability) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(liability);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update liability" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const liability = await Liability.findByIdAndDelete(id);
        if (!liability) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete liability" }, { status: 500 });
    }
}
