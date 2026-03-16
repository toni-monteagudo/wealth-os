import { generateObject } from "ai";
import { z } from "zod";
import { RawTransaction } from "./csv-parser";

const CHUNK_SIZE = 50;

const chunkCategorizationSchema = z.object({
    transactions: z.array(z.object({
        index: z.number().describe("The original index of the transaction from the input list (0-based)"),
        category: z.string().describe("Category for this transaction. MUST be one of the provided categories. Use OTROS if none fits."),
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

    let prompt = `Categorize these ${chunk.length} bank transactions.

TRANSACTIONS TO CATEGORIZE:
[
${txList}
]

AVAILABLE CATEGORIES: ${categoryNames.join(", ")}

If no category fits, use OTROS and suggest a new one in suggestedNewCategories.`;

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
): Promise<{ categorized: Map<number, { category: string; linkedAssetId?: string }>; suggested: string[]; retried: boolean; fallback: boolean }> {
    const systemPrompt = `You are a financial transaction categorizer. For each transaction, assign a category and optionally link to a portfolio asset. Return EXACTLY ${chunk.length} results, one per input transaction, preserving the index field.`;

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

            const resultMap = new Map<number, { category: string; linkedAssetId?: string }>();
            for (const t of object.transactions) {
                resultMap.set(t.index, { category: t.category, linkedAssetId: t.linkedAssetId });
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
            const resultMap = new Map<number, { category: string; linkedAssetId?: string }>();
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

    const allCategorized = new Map<number, { category: string; linkedAssetId?: string }>();
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
