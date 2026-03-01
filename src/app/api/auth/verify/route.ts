import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
    await dbConnect();

    try {
        const body = await req.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        user.isVerified = true;
        user.verificationToken = undefined; // clear token
        await user.save();

        return NextResponse.json({ message: "Email verified successfully." });

    } catch (error) {
        console.error("Verify error:", error);
        return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
    }
}
