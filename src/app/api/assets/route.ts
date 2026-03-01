import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";

export async function GET() {
    await dbConnect();
    try {
        const assets = await Asset.find({}).sort({ createdAt: -1 });
        return NextResponse.json(assets);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const asset = await Asset.create(body);
        return NextResponse.json(asset, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create asset" }, { status: 400 });
    }
}
