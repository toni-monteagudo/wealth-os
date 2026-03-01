import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";
import Liability from "@/models/Liability";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const asset = await Asset.findById(id);
        if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(asset);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const asset = await Asset.findByIdAndUpdate(id, body, { new: true });
        if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(asset);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update asset" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        // Cascade unlink liabilities
        await Liability.updateMany({ linkedAssetId: id }, { $unset: { linkedAssetId: 1 } });

        const asset = await Asset.findByIdAndDelete(id);
        if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }
}
