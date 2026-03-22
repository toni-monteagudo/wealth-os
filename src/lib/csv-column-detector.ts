import { generateObject } from "ai";
import { z } from "zod";
import Papa from "papaparse";

const columnDetectionSchema = z.object({
    dateColumn: z.string().describe("Exact header name of the column containing transaction dates"),
    descriptionColumn: z.string().describe("Exact header name of the column with transaction descriptions/concepts"),
    amountColumn: z.string().optional().describe("Exact header name of the single amount column (signed: negative=expense, positive=income). Leave empty if amounts are split into separate debit/credit columns."),
    debitColumn: z.string().optional().describe("Exact header name of the debit/expense column, only if amount is split into two columns"),
    creditColumn: z.string().optional().describe("Exact header name of the credit/income column, only if amount is split into two columns"),
    dateFormat: z.string().describe("Date format detected, e.g. DD/MM/YYYY, YYYY-MM-DD, DD-MM-YY"),
    decimalSeparator: z.enum([",", "."]).describe("Decimal separator used in amounts: ',' for Spanish format (1.234,56) or '.' for international (1,234.56)"),
});

export type ColumnMapping = z.infer<typeof columnDetectionSchema>;

/**
 * Use AI to detect column mapping when heuristics fail.
 * Sends only the first 5-10 rows as a sample.
 */
export async function detectColumnsWithAI(
    csvText: string,
    model: any
): Promise<ColumnMapping> {
    // Parse just to get headers and a few rows
    const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: "greedy" as any,
        dynamicTyping: false,
        preview: 10, // Only parse first 10 rows
    });

    const headers = result.meta.fields || [];
    const sampleRows = result.data as Record<string, string>[];

    // Build a compact sample for the AI
    const sampleText = [
        `Headers: ${headers.join(" | ")}`,
        "",
        "Sample rows:",
        ...sampleRows.slice(0, 5).map((row, i) =>
            `Row ${i + 1}: ${headers.map(h => `${h}="${row[h] || ""}"`).join(", ")}`
        ),
    ].join("\n");

    const { object } = await generateObject({
        model,
        schema: columnDetectionSchema,
        system: "You are a CSV format detection assistant. Analyze the headers and sample rows from a bank statement CSV file. Identify which columns contain the transaction date, description, and amount. Use the EXACT header names from the file. Some banks split amounts into separate debit (cargo/debe) and credit (abono/haber) columns instead of a single signed amount column.",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: `Detect the column structure of this bank CSV:\n\n${sampleText}` },
                ],
            },
        ],
    });

    return object;
}
