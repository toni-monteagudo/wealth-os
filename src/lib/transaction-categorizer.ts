import { generateObject } from "ai";
import { z } from "zod";
import { RawTransaction } from "./csv-parser";

const CHUNK_SIZE = 50;

const chunkCategorizationSchema = z.object({
    transactions: z.array(z.object({
        index: z.number().describe("The original index of the transaction from the input list (0-based)"),
        category: z.string().describe("Category for this transaction. Use one of the provided categories when possible. If none fits well, assign a new descriptive category name (uppercase, no accents, e.g. FARMACIA, MASCOTAS) and also add it to suggestedNewCategories."),
        friendlyDescription: z.string().describe("A short, clean, human-friendly description of this transaction. Simplify cryptic bank codes into readable text. E.g. '0057950 FACEBOOK IRELAND LTD' → 'Facebook Ads', 'BIZUM ENVI A JUAN PEREZ' → 'Bizum a Juan Pérez', 'RECIBO LUZ IBERDROLA' → 'Recibo Iberdrola (luz)'. Keep the original meaning, just make it readable."),
        linkedAssetId: z.string().optional().describe("ID of the linked asset if the transaction clearly corresponds to one. Use the exact ID from the portfolio list."),
    })),
    suggestedNewCategories: z.array(z.string()).optional().describe("New category suggestions not in the existing list. Uppercase, no accents (e.g. FARMACIA, MASCOTAS). Only suggest if truly needed."),
});

export interface ChunkProgress {
    phase: "categorizing";
    chunk: number;
    totalChunks: number;
    processed: number;
    total: number;
}

export interface CategorizationStats {
    totalChunks: number;
    successfulChunks: number;
    retriedChunks: number;
    fallbackChunks: number;
}

export interface CategorizedTransaction {
    date: string;
    description: string;
    friendlyDescription?: string;
    amount: number;
    category: string;
    linkedAssetId?: string;
}

export interface CategorizationResult {
    transactions: CategorizedTransaction[];
    suggestedNewCategories: string[];
    stats: CategorizationStats;
}

function buildChunkPrompt(
    chunk: { index: number; date: string; description: string; amount: number }[],
    categoryNames: string[],
    portfolioContext: string,
    isRetry: boolean
): string {
    const txList = chunk.map(t =>
        `  {index: ${t.index}, date: "${t.date}", description: "${t.description}", amount: ${t.amount}}`
    ).join(",\n");

    let prompt = `Categorize these ${chunk.length} bank transactions and generate a friendly description for each one.

TRANSACTIONS TO CATEGORIZE:
[
${txList}
]

AVAILABLE CATEGORIES: ${categoryNames.join(", ")}

CATEGORY RULES:
- Use an existing category whenever possible.
- If no existing category fits, assign a NEW category name directly to the transaction (uppercase, no accents, e.g. FARMACIA, MASCOTAS) AND add it to suggestedNewCategories.
- Do NOT use OTROS when a more specific new category would be better. Only use OTROS as a last resort when no meaningful category can be determined.

FRIENDLY DESCRIPTION RULES:
For each transaction, generate a short, clean, human-readable "friendlyDescription" from the raw bank description.
- Remove numeric codes, reference numbers, and internal bank identifiers
- Keep merchant/company names and the core purpose
- Examples:
  "0057950 FACEBOOK IRELAND LTD" → "Facebook Ads"
  "BIZUM ENVIADO A GARCIA LOPEZ JUAN" → "Bizum a Juan García López"
  "RECIBO LUZ ENDESA ENERGIA SA" → "Recibo Endesa (luz)"
  "TRANSFERENCIA SEPA DE EMPRESA SL NOMINA" → "Nómina Empresa SL"
  "PAGO TARJ. 4532****1234 MERCADONA" → "Mercadona"
  "COMISION MANTENIMIENTO CUENTA" → "Comisión mantenimiento cuenta"
- The friendlyDescription MUST NOT be empty. If the description is already clean, use it as-is.`;

    if (portfolioContext) {
        prompt += `\n\nWhen a transaction clearly corresponds to a portfolio asset, set linkedAssetId. Match by: keywords in description, rent income matching tenant monthlyRent, or loan payments matching monthly payment.${portfolioContext}`;
    }

    if (isRetry) {
        prompt += `\n\nIMPORTANT: You MUST return EXACTLY ${chunk.length} transactions with indices ${chunk[0].index} through ${chunk[chunk.length - 1].index}. Do NOT skip any.`;
    }

    return prompt;
}

async function categorizeChunk(
    chunk: { index: number; date: string; description: string; amount: number }[],
    model: any,
    categoryNames: string[],
    portfolioContext: string,
): Promise<{ categorized: Map<number, { category: string; friendlyDescription?: string; linkedAssetId?: string }>; suggested: string[]; retried: boolean; fallback: boolean }> {
    const systemPrompt = `You are a financial transaction categorizer. For each transaction, assign a category, generate a short human-friendly description, and optionally link to a portfolio asset. Return EXACTLY ${chunk.length} results, one per input transaction, preserving the index field.`;

    let retried = false;
    let fallback = false;

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const { object } = await generateObject({
                model,
                schema: chunkCategorizationSchema,
                system: systemPrompt,
                messages: [{
                    role: "user",
                    content: [{ type: "text", text: buildChunkPrompt(chunk, categoryNames, portfolioContext, attempt > 0) }],
                }],
            });

            const resultMap = new Map<number, { category: string; friendlyDescription?: string; linkedAssetId?: string }>();
            for (const t of object.transactions) {
                resultMap.set(t.index, { category: t.category, friendlyDescription: t.friendlyDescription, linkedAssetId: t.linkedAssetId });
            }

            if (resultMap.size === chunk.length) {
                return {
                    categorized: resultMap,
                    suggested: object.suggestedNewCategories || [],
                    retried: attempt > 0,
                    fallback: false,
                };
            }

            // Count mismatch — retry on first attempt
            if (attempt === 0) {
                retried = true;
                continue;
            }

            // Second attempt also mismatched — use partial results + fill gaps
            fallback = true;
            for (const c of chunk) {
                if (!resultMap.has(c.index)) {
                    resultMap.set(c.index, { category: "OTROS" });
                }
            }

            return {
                categorized: resultMap,
                suggested: object.suggestedNewCategories || [],
                retried: true,
                fallback: true,
            };
        } catch (error: any) {
            // Transient error (rate limit, network) — retry once
            if (attempt === 0) {
                retried = true;
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            // Persistent failure — fallback entire chunk
            const resultMap = new Map<number, { category: string; friendlyDescription?: string; linkedAssetId?: string }>();
            for (const c of chunk) {
                resultMap.set(c.index, { category: "OTROS" });
            }
            return { categorized: resultMap, suggested: [], retried: true, fallback: true };
        }
    }

    // Should never reach here, but TypeScript safety
    const resultMap = new Map<number, { category: string; linkedAssetId?: string }>();
    for (const c of chunk) {
        resultMap.set(c.index, { category: "OTROS" });
    }
    return { categorized: resultMap, suggested: [], retried: true, fallback: true };
}

export async function categorizeInChunks(
    transactions: RawTransaction[],
    model: any,
    categoryNames: string[],
    portfolioContext: string,
    onChunkComplete?: (progress: ChunkProgress) => void,
    chunkSize: number = CHUNK_SIZE,
): Promise<CategorizationResult> {
    const indexed = transactions.map((tx, i) => ({ index: i, ...tx }));
    const chunks: typeof indexed[] = [];

    for (let i = 0; i < indexed.length; i += chunkSize) {
        chunks.push(indexed.slice(i, i + chunkSize));
    }

    const allCategorized = new Map<number, { category: string; friendlyDescription?: string; linkedAssetId?: string }>();
    const allSuggested = new Set<string>();
    const stats: CategorizationStats = {
        totalChunks: chunks.length,
        successfulChunks: 0,
        retriedChunks: 0,
        fallbackChunks: 0,
    };

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        const result = await categorizeChunk(chunk, model, categoryNames, portfolioContext);

        for (const [index, cat] of result.categorized) {
            allCategorized.set(index, cat);
        }
        for (const s of result.suggested) {
            allSuggested.add(s);
        }

        if (result.fallback) stats.fallbackChunks++;
        else if (result.retried) stats.retriedChunks++;
        else stats.successfulChunks++;

        onChunkComplete?.({
            phase: "categorizing",
            chunk: i + 1,
            totalChunks: chunks.length,
            processed: Math.min((i + 1) * chunkSize, transactions.length),
            total: transactions.length,
        });
    }

    // Merge raw transactions with AI categorization
    const categorizedTransactions: CategorizedTransaction[] = transactions.map((tx, i) => {
        const cat = allCategorized.get(i) || { category: "OTROS" };
        return {
            date: tx.date,
            description: tx.description,
            friendlyDescription: cat.friendlyDescription,
            amount: tx.amount,
            category: cat.category,
            linkedAssetId: cat.linkedAssetId,
        };
    });

    return {
        transactions: categorizedTransactions,
        suggestedNewCategories: Array.from(allSuggested),
        stats,
    };
}
