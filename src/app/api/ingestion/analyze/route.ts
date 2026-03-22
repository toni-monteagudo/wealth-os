import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import Asset from "@/models/Asset";
import Liability from "@/models/Liability";
import Transaction from "@/models/Transaction";
import IngestionBatch from "@/models/IngestionBatch";
import Category, { DEFAULT_CATEGORIES } from "@/models/Category";
import { parseBankCsv, parseBankCsvWithMapping, xlsxToCsv } from "@/lib/csv-parser";
import { detectColumnsWithAI } from "@/lib/csv-column-detector";
import { categorizeInChunks } from "@/lib/transaction-categorizer";

const loanDocumentSchema = z.object({
    bank: z.string().describe("Nombre de la entidad bancaria o prestamista"),
    type: z.enum(["mortgage", "loan"]).describe("Si es una hipoteca (mortgage) o préstamo personal (loan)"),
    initialCapital: z.number().optional().describe("Capital original total concedido en la firma del préstamo (no el saldo pendiente actual)"),
    startDate: z.string().optional().describe("Fecha de firma o inicio del préstamo en formato YYYY-MM-DD"),
    termMonths: z.number().optional().describe("Plazo total de amortización en meses (PLAZO EN MESES)"),
    interestType: z.enum(["fixed", "variable"]).optional().describe("Tipo de interés principal: fijo (fixed) o variable (variable)"),
    tin: z.number().optional().describe("TIN (Tipo de Interés Nominal) actual aplicable al préstamo. Este es el que determina la cuota matemática pura."),
    tae: z.number().optional().describe("TAE (Tasa Anual Equivalente) actual. Representa el coste real incluyendo comisiones."),
    interestRate: z.number().describe("Si el documento no especifica claramente TIN o TAE, introduce aquí el porcentaje de interés general."),
    lateInterestRate: z.number().optional().describe("Interés de demora aplicable en caso de impago (en porcentaje)"),
    amortizationCommission: z.number().optional().describe("Comisión por amortización temprana o anticipada (en porcentaje)"),
    cancellationCommission: z.number().optional().describe("Comisión por cancelación total (en porcentaje)"),
    paymentChargeDay: z.number().optional().describe("Día del mes en el que se suele pasar o cargar el recibo (ej: 1 al 31)"),
    monthlyPayment: z.number().describe("Cuota mensual actual a pagar (incluyendo ambos componentes: capital e intereses)"),
    loanNumber: z.string().optional().describe("Número de cuenta del préstamo o referencia (opcional)")
});

// Helper to initialize the correct AI provider based on settings
async function getAiModel() {
    await dbConnect();
    const settings = await Settings.findOne();

    if (!settings || !settings.activeProvider || !settings.providers?.length) {
        throw new Error("AI Provider not configured. Please visit Settings.");
    }

    const providerConfig = settings.providers.find(
        (p: any) => p.name === settings.activeProvider
    );

    if (!providerConfig || !providerConfig.apiKey) {
        throw new Error(`API Key for ${settings.activeProvider} not configured. Please visit Settings.`);
    }

    switch (providerConfig.name) {
        case 'openai':
            const openai = createOpenAI({ apiKey: providerConfig.apiKey });
            return openai(providerConfig.model || 'gpt-4o');
        case 'google':
            const google = createGoogleGenerativeAI({ apiKey: providerConfig.apiKey });
            let modelName = providerConfig.model || 'gemini-1.5-pro';
            if (modelName.startsWith('models/')) {
                modelName = modelName.replace('models/', '');
            }
            if (modelName === 'gemini-1.5-flash') {
                modelName = 'gemini-1.5-flash-latest';
            }
            return google(modelName);
        case 'anthropic':
            const anthropic = createAnthropic({ apiKey: providerConfig.apiKey });
            return anthropic(providerConfig.model || 'claude-3-5-sonnet-latest');
        default:
            throw new Error(`Unsupported AI Provider: ${providerConfig.name}`);
    }
}

// Build a compact portfolio summary for the AI context
async function buildPortfolioContext(): Promise<string> {
    const assets = await Asset.find({}, "_id name location keywords tenants.name tenants.monthlyRent").lean();
    const liabilities = await Liability.find({}, "bank monthlyPayment loanNumber linkedAssetId type name").lean();

    if (assets.length === 0 && liabilities.length === 0) return "";

    const assetMap = new Map(assets.map((a: any) => [a._id.toString(), a.name]));

    let context = "\n\nPORTFOLIO DEL USUARIO:";

    if (assets.length > 0) {
        context += "\nActivos:";
        for (const a of assets as any[]) {
            const tenantInfo = a.tenants?.length
                ? `, Inquilinos: [${a.tenants.map((t: any) => `{nombre: "${t.name}", alquiler: ${t.monthlyRent}}`).join(", ")}]`
                : "";
            const keywordInfo = a.keywords?.length
                ? `, Keywords: [${a.keywords.join(", ")}]`
                : "";
            context += `\n- ID: "${a._id}", Nombre: "${a.name}"${a.location ? `, Ubicación: "${a.location}"` : ""}${keywordInfo}${tenantInfo}`;
        }
    }

    if (liabilities.length > 0) {
        context += "\nPréstamos vinculados a activos:";
        for (const l of liabilities as any[]) {
            const assetName = l.linkedAssetId ? assetMap.get(l.linkedAssetId.toString()) : null;
            const assetInfo = assetName ? `, activo: "${assetName}" (${l.linkedAssetId})` : "";
            context += `\n- Banco: "${l.bank}", cuota: ${l.monthlyPayment}${l.loanNumber ? `, ref: "${l.loanNumber}"` : ""}${assetInfo}`;
        }
    }

    return context;
}

// SSE helper
function sseEvent(data: Record<string, any>): string {
    return `data: ${JSON.stringify(data)}\n\n`;
}

// ── LOAN DOCUMENT HANDLER (unchanged single AI call) ──
async function handleLoanDocument(buffer: Buffer, mimeType: string, model: any): Promise<Response> {
    const base64Content = buffer.toString('base64');

    let messages: any[];
    if (mimeType === 'text/csv' || mimeType.includes('text/')) {
        const textContent = buffer.toString('utf8');
        messages = [{ role: 'user', content: [{ type: "text", text: `Please extract data from the following document:\n\n${textContent}` }] }];
    } else {
        messages = [{
            role: 'user',
            content: [
                { type: "text", text: "Please extract structured data from this document based on the required schema." },
                { type: "image", image: `data:${mimeType};base64,${base64Content}` },
            ],
        }];
    }

    const systemPrompt = "You are an expert loan officer. You are scanning a loan or mortgage statement. ALWAYS focus on extracting the ORIGINATION details of the loan (capital originalmente concedido, plazo total en meses, fecha de firma original) rather than the point-in-time current balance. Extrae cuidadosamente todas las penalizaciones y comisiones asociadas descritas en las condiciones.";

    // @ts-ignore
    const { object } = await generateObject({
        model,
        schema: loanDocumentSchema,
        system: systemPrompt,
        messages,
    });

    return NextResponse.json(object);
}

// ── STATEMENT HANDLER (new chunked pipeline with SSE) ──
async function handleStatement(file: File, buffer: Buffer, mimeType: string, model: any, userContext: string = "", useOnlyExistingCategories: boolean = false): Promise<Response> {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const parseStart = Date.now();

                // ── PHASE 1: Parse CSV deterministically ──
                controller.enqueue(encoder.encode(sseEvent({ phase: "parsing", message: "Parsing CSV..." })));

                let csvText: string;
                if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || file.name.match(/\.xlsx?$/i)) {
                    csvText = xlsxToCsv(buffer);
                } else {
                    csvText = buffer.toString("utf8");
                }

                let parseResult = parseBankCsv(csvText);

                // ── PHASE 1b: AI column detection fallback ──
                if (!parseResult) {
                    controller.enqueue(encoder.encode(sseEvent({ phase: "detecting", message: "Detecting CSV column format with AI..." })));

                    try {
                        const columnMapping = await detectColumnsWithAI(csvText, model);
                        parseResult = parseBankCsvWithMapping(csvText, columnMapping);
                    } catch (detectError: any) {
                        controller.enqueue(encoder.encode(sseEvent({
                            phase: "error",
                            message: "No se pudo detectar el formato del CSV. Asegúrate de que tiene columnas de fecha, concepto e importe.",
                        })));
                        controller.close();
                        return;
                    }

                    if (!parseResult) {
                        controller.enqueue(encoder.encode(sseEvent({
                            phase: "error",
                            message: "No se pudo parsear el CSV incluso tras detectar las columnas. Revisa el formato del archivo.",
                        })));
                        controller.close();
                        return;
                    }
                }

                const parseTimeMs = Date.now() - parseStart;
                const { transactions: rawTransactions, warnings, totalRowsInFile } = parseResult;

                controller.enqueue(encoder.encode(sseEvent({
                    phase: "parsed",
                    totalRows: totalRowsInFile,
                    parsedCount: rawTransactions.length,
                    warnings: warnings.length > 0 ? warnings.slice(0, 10) : undefined,
                })));

                // ── PHASE 2: Chunked AI categorization ──
                await dbConnect();

                const portfolioContext = await buildPortfolioContext();

                const categoryCount = await Category.countDocuments();
                if (categoryCount === 0) {
                    await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name })));
                }
                const categories = await Category.find().lean();
                const categoryNames = categories.map((c: any) => c.name);

                const categorizeStart = Date.now();

                const fullContext = userContext
                    ? `${portfolioContext}\n\nCONTEXTO DEL USUARIO:\n${userContext}`
                    : portfolioContext;

                const categorizationResult = await categorizeInChunks(
                    rawTransactions,
                    model,
                    categoryNames,
                    fullContext,
                    (progress) => {
                        controller.enqueue(encoder.encode(sseEvent(progress)));
                    },
                    undefined,
                    useOnlyExistingCategories,
                );

                const categorizeTimeMs = Date.now() - categorizeStart;

                // ── PHASE 3: Historical enrichment ──
                controller.enqueue(encoder.encode(sseEvent({ phase: "enriching", message: "Enriching with historical data..." })));

                const enrichedTransactions = await Promise.all(
                    categorizationResult.transactions.map(async (tx) => {
                        if (!tx.linkedAssetId) {
                            const historicalTx = await Transaction.findOne({
                                description: tx.description,
                                category: { $ne: "UNCATEGORIZED" },
                            }).sort({ date: -1, createdAt: -1 });

                            if (historicalTx) {
                                return {
                                    ...tx,
                                    friendlyDescription: tx.friendlyDescription || historicalTx.friendlyDescription,
                                    category: historicalTx.category || tx.category,
                                    linkedAssetId: historicalTx.linkedAssetId?.toString() || tx.linkedAssetId,
                                    tags: historicalTx.tags?.length ? historicalTx.tags : [],
                                    confirmed: false,
                                };
                            }
                        }

                        return { ...tx, friendlyDescription: tx.friendlyDescription, tags: [], confirmed: false };
                    })
                );

                // ── PHASE 4: Create IngestionBatch ──
                const batch = await IngestionBatch.create({
                    fileName: file.name,
                    transactions: enrichedTransactions,
                    suggestedCategories: categorizationResult.suggestedNewCategories,
                    useOnlyExistingCategories,
                    totalCount: enrichedTransactions.length,
                    confirmedCount: 0,
                    status: "in_review",
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    processingStats: {
                        parseTimeMs,
                        categorizeTimeMs,
                        totalChunks: categorizationResult.stats.totalChunks,
                        retriedChunks: categorizationResult.stats.retriedChunks,
                        fallbackChunks: categorizationResult.stats.fallbackChunks,
                    },
                });

                controller.enqueue(encoder.encode(sseEvent({
                    phase: "complete",
                    batchId: batch._id,
                    totalCount: batch.totalCount,
                    stats: {
                        parseTimeMs,
                        categorizeTimeMs,
                        ...categorizationResult.stats,
                    },
                })));

                controller.close();
            } catch (error: any) {
                console.error("AI Ingestion Error:", error);
                controller.enqueue(encoder.encode(sseEvent({
                    phase: "error",
                    message: error.message || "Error al analizar el documento.",
                })));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as "statement" | "loan";
        const userContext = (formData.get("userContext") as string) || "";
        const useOnlyExistingCategories = formData.get("useOnlyExistingCategories") === "true";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (type !== 'statement' && type !== 'loan') {
            return NextResponse.json({ error: "Invalid document type. Expected 'statement' or 'loan'." }, { status: 400 });
        }

        const model = await getAiModel();
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;

        if (type === 'loan') {
            return handleLoanDocument(buffer, mimeType, model);
        }

        return handleStatement(file, buffer, mimeType, model, userContext, useOnlyExistingCategories);

    } catch (error: any) {
        console.error("AI Ingestion Error:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze document" }, { status: 500 });
    }
}
