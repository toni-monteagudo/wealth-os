import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
    await dbConnect();
    try {
        const count = await User.countDocuments();
        return NextResponse.json({
            isInitialized: count > 0,
            hasAdmin: count > 0
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch setup status" }, { status: 500 });
    }
}
