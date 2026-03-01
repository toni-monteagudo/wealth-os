import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    await dbConnect();

    try {
        const count = await User.countDocuments();
        if (count > 0) {
            return NextResponse.json({ error: "Application is already initialized. Cannot create another admin." }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationToken = uuidv4();

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            isVerified: false,
            verificationToken
        });

        // In a real app, send email here. For now, we return the token to simulate it.
        return NextResponse.json({
            message: "Admin created successfully. Please verify your email.",
            verificationToken
        }, { status: 201 });

    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: "Failed to setup application" }, { status: 500 });
    }
}
