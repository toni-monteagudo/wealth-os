import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";

// POST — Add a new tenant to an asset
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const tenant = await req.json();
        const asset = await Asset.findByIdAndUpdate(
            id,
            { $push: { tenants: tenant } },
            { new: true }
        );
        if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        return NextResponse.json(asset);
    } catch (error) {
        console.error("Failed to add tenant", error);
        return NextResponse.json({ error: "Failed to add tenant" }, { status: 400 });
    }
}

// PUT — Update a specific tenant by tenant._id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const { tenantId, ...tenantData } = await req.json();
        const asset = await Asset.findOneAndUpdate(
            { _id: id, "tenants._id": tenantId },
            { $set: { "tenants.$": { _id: tenantId, ...tenantData } } },
            { new: true }
        );
        if (!asset) return NextResponse.json({ error: "Asset or tenant not found" }, { status: 404 });
        return NextResponse.json(asset);
    } catch (error) {
        console.error("Failed to update tenant", error);
        return NextResponse.json({ error: "Failed to update tenant" }, { status: 400 });
    }
}

// DELETE — Remove a tenant from an asset
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const { tenantId } = await req.json();
        const asset = await Asset.findByIdAndUpdate(
            id,
            { $pull: { tenants: { _id: tenantId } } },
            { new: true }
        );
        if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        return NextResponse.json(asset);
    } catch (error) {
        console.error("Failed to remove tenant", error);
        return NextResponse.json({ error: "Failed to remove tenant" }, { status: 400 });
    }
}
