import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const expense = await req.json(); // { concept, category, provider, status, amount }

        // Find project, push expense, and update actualSpent
        const project = await Project.findById(id);
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        project.expenses.push(expense);

        // Recalculate actual spent based on paid/deposited expenses
        project.actualSpent = project.expenses
            .filter((e) => e.status !== "Pendiente")
            .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        await project.save();

        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: "Failed to add expense" }, { status: 400 });
    }
}
