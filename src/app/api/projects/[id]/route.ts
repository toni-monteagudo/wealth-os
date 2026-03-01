import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const project = await Project.findById(id).populate("linkedAssetId");
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const project = await Project.findByIdAndUpdate(id, body, { new: true }).populate("linkedAssetId");
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update project" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const project = await Project.findByIdAndDelete(id);
        if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
