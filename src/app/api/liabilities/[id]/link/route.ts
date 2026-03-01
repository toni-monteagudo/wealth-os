import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Liability from "@/models/Liability";
import Asset from "@/models/Asset";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const { assetId } = await req.json();

        // verify asset exists
        const asset = await Asset.findById(assetId);
        if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

        const liability = await Liability.findByIdAndUpdate(
            id,
            { linkedAssetId: assetId },
            { new: true }
        ).populate("linkedAssetId");

        if (!liability) return NextResponse.json({ error: "Liability not found" }, { status: 404 });

        return NextResponse.json(liability);
    } catch (error) {
        return NextResponse.json({ error: "Failed to link liability" }, { status: 400 });
    }
}
