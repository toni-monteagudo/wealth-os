import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Liability from "@/models/Liability";

export async function GET() {
    await dbConnect();
    try {
        const liabilities = await Liability.find({}).populate("linkedAssetId");
        return NextResponse.json(liabilities);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch liabilities" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const liability = await Liability.create(body);
        return NextResponse.json(liability, { status: 201 });
    } catch (error) {
        console.error("Error creating liability:", error);
        return NextResponse.json({ error: "Failed to create liability" }, { status: 400 });
    }
}
