import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // property, legal, insurance
        const query = type && type !== "all" ? { type } : {};

        const documents = await Document.find(query).sort({ uploadDate: -1 });
        return NextResponse.json(documents);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const document = await Document.create(body);
        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create document" }, { status: 400 });
    }
}
