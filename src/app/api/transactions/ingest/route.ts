import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Papa from "papaparse";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
    await dbConnect();
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const buffer = await file.arrayBuffer();
        let data: any[] = [];

        if (file.name.endsWith(".csv")) {
            const text = new TextDecoder().decode(buffer);
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            data = parsed.data;
        } else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
            const workbook = xlsx.read(buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
            return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
        }

        const transactions = [];
        for (const row of data) {
            const rawDescription = (row.Description || row.Concepto || row.Concept || "Unknown").trim();
            const date = row.Date || row.Fecha || new Date().toISOString();

            // Handle European number formats e.g. "1.245,00" -> -1245
            let amountStr = row.Amount || row.Importe || "0";
            if (typeof amountStr === "string") {
                amountStr = amountStr.replace(/\./g, "").replace(/,/g, ".");
            }
            const amount = parseFloat(amountStr);

            // Very basic auto-categorization fallback
            const descLower = rawDescription.toLowerCase();
            let category = "UNCATEGORIZED";
            let tags: string[] = [];
            let linkedAssetId = undefined;

            if (descLower.includes("hipoteca") || descLower.includes("prestamo") || descLower.includes("mortgage")) {
                category = "AMORTIZATION";
                tags = ["HIPOTECA"];
            } else if (descLower.includes("nomina") || descLower.includes("ingreso") || descLower.includes("payroll")) {
                category = "REVENUE";
                tags = ["SALARIO"];
            } else if (descLower.includes("amazon") || descLower.includes("compra")) {
                category = "EXPENSE";
                tags = ["COMPRAS"];
            } else if (descLower.includes("stripe")) {
                category = "REVENUE";
                tags = ["SAAS"];
            }

            // AI-like historical pre-assignment (lookup previous transaction with same description)
            const historicalTx = await Transaction.findOne({
                description: rawDescription,
                category: { $ne: "UNCATEGORIZED" }
            }).sort({ date: -1, createdAt: -1 });

            if (historicalTx) {
                category = historicalTx.category;
                tags = historicalTx.tags || [];
                linkedAssetId = historicalTx.linkedAssetId;
            }

            transactions.push({
                date,
                description: rawDescription,
                amount: isNaN(amount) ? 0 : amount,
                category,
                tags,
                status: "needs_review",
                linkedAssetId,
                source: "csv_import",
                processingTime: "Just now",
            });
        }

        const inserted = await Transaction.insertMany(transactions);

        return NextResponse.json({
            success: true,
            count: inserted.length,
            needsReview: inserted.length
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to ingest transactions" }, { status: 500 });
    }
}
