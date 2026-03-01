import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Document from "@/models/Document";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const document = await Document.findById(id);
        if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(document);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const document = await Document.findByIdAndUpdate(id, body, { new: true });
        if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(document);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update document" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const document = await Document.findByIdAndDelete(id);
        if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
