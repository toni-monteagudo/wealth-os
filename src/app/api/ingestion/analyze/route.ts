import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

// Zod schemas for structured extraction
const bankStatementSchema = z.object({
    transactions: z.array(z.object({
        date: z.string().describe("Fecha de la transacción en formato YYYY-MM-DD"),
        description: z.string().describe("Concepto o descripción limpia del movimiento"),
        amount: z.number().describe("Importe de la transacción. Negativo para gastos, positivo para ingresos."),
        category: z.string().describe("Categoría inferida (ej: Supermercado, Transporte, Nómina, Restaurantes)")
    }))
});

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
            // Google SDK automatically prepends "models/" if not present, but sometimes causes issues if double-prefixed or aliased incorrectly. 
            // We strip "models/" if the user typed it, just to be safe.
            if (modelName.startsWith('models/')) {
                modelName = modelName.replace('models/', '');
            }
            // Some API regions/keys reject the bare 'gemini-1.5-flash' name. Alias it to the latest version.
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

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as "statement" | "loan"; // Expected values from the frontend

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (type !== 'statement' && type !== 'loan') {
            return NextResponse.json({ error: "Invalid document type. Expected 'statement' or 'loan'." }, { status: 400 });
        }

        const model = await getAiModel();

        // Convert file to base64 for vision models
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Content = buffer.toString('base64');
        const mimeType = file.type;

        let messages: any[];

        if (mimeType === 'text/csv' || mimeType.includes('text/')) {
            const textContent = buffer.toString('utf8');
            messages = [
                {
                    role: 'user',
                    content: [
                        { type: "text", text: `Please extract data from the following document:\n\n${textContent}` }
                    ]
                }
            ];
        } else {
            messages = [
                {
                    role: 'user',
                    content: [
                        { type: "text", text: "Please extract structured data from this document based on the required schema." },
                        {
                            type: "image",
                            image: `data:${mimeType};base64,${base64Content}`
                        }
                    ]
                }
            ];
        }

        const schema = type === 'statement' ? bankStatementSchema : loanDocumentSchema;
        const systemPrompt = type === 'statement'
            ? "You are an expert financial assistant. Analyze this bank statement and extract a structured list of transactions. Ensure amounts use the correct negative/positive sign."
            : "You are an expert loan officer. You are scanning a loan or mortgage statement. ALWAYS focus on extracting the ORIGINATION details of the loan (capital originalmente concedido, plazo total en meses, fecha de firma original) rather than the point-in-time current balance. Extrae cuidadosamente todas las penalizaciones y comisiones asociadas descritas en las condiciones.";

        // @ts-ignore - The `ai` SDK handles image parts differently depending on version. We'll pass the content safely.
        const { object } = await generateObject({
            model: model,
            schema: schema,
            system: systemPrompt,
            messages: messages,
        });

        return NextResponse.json(object);

    } catch (error: any) {
        console.error("AI Ingestion Error:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze document" }, { status: 500 });
    }
}
