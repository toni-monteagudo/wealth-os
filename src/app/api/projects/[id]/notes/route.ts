import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const note = await req.json(); // { text, date, isImportant }

        const project = await Project.findByIdAndUpdate(
            id,
            { $push: { notes: { $each: [note], $position: 0 } } }, // unshift to top
            { new: true }
        );

        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: "Failed to add note" }, { status: 400 });
    }
}
