import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { buildTransactionQuery } from "@/lib/transactionQueryBuilder";

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const query = buildTransactionQuery(searchParams);

        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const sortBy = searchParams.get("sortBy") || "date";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
        const paginated = searchParams.get("paginated") === "true";

        // Build sort object
        const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder };
        if (sortBy === "date") sortObj.createdAt = sortOrder;

        if (paginated) {
            const skip = (page - 1) * limit;
            const [transactions, total] = await Promise.all([
                Transaction.find(query).sort(sortObj).skip(skip).limit(limit),
                Transaction.countDocuments(query),
            ]);

            return NextResponse.json({
                data: transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                },
            });
        }

        // Legacy response: plain array (backward compatible)
        const transactions = await Transaction.find(query)
            .sort(sortObj)
            .limit(limit);

        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const transaction = await Transaction.create({ ...body, source: "manual" });
        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 400 });
    }
}
