import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Category, { DEFAULT_CATEGORIES } from "@/models/Category";

async function ensureSeeded() {
    const count = await Category.countDocuments();
    if (count === 0) {
        await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name })));
    }
}

export async function GET() {
    await dbConnect();
    try {
        await ensureSeeded();
        const categories = await Category.find().sort({ name: 1 });
        return NextResponse.json(categories);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { name } = await req.json();
        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        const normalized = name.trim().toUpperCase();
        const existing = await Category.findOne({ name: normalized });
        if (existing) {
            return NextResponse.json(existing);
        }

        const category = await Category.create({ name: normalized });
        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "Category ID required" }, { status: 400 });
        }

        await Category.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
