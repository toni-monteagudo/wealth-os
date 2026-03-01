import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Reserve from "@/models/Reserve";

export async function GET() {
    await dbConnect();
    try {
        const reserves = await Reserve.find({}).populate("linkedAssetId").sort({ createdAt: -1 });
        return NextResponse.json(reserves);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch reserves" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const reserve = await Reserve.create(body);
        return NextResponse.json(reserve, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create reserve" }, { status: 400 });
    }
}
