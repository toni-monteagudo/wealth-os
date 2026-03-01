import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Reserve from "@/models/Reserve";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const reserve = await Reserve.findById(id).populate("linkedAssetId");
        if (!reserve) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(reserve);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch reserve" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const reserve = await Reserve.findByIdAndUpdate(id, body, { new: true });
        if (!reserve) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(reserve);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update reserve" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const reserve = await Reserve.findByIdAndDelete(id);
        if (!reserve) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete reserve" }, { status: 500 });
    }
}
