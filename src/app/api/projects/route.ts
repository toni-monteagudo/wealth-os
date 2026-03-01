import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";

export async function GET() {
    await dbConnect();
    try {
        const projects = await Project.find({}).populate("linkedAssetId").sort({ createdAt: -1 });
        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const project = await Project.create(body);
        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create project" }, { status: 400 });
    }
}
