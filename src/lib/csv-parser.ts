import Papa from "papaparse";

export interface RawTransaction {
    date: string;       // normalized to YYYY-MM-DD
    description: string;
    amount: number;
}

export interface DetectedFormat {
    dateColumn: string;
    descriptionColumn: string;
    amountColumn: string;
    debitColumn?: string;
    creditColumn?: string;
}

export interface CsvParseResult {
    transactions: RawTransaction[];
    detectedFormat: DetectedFormat;
    totalRowsInFile: number;
    warnings: string[];
}

// Known header patterns for Spanish banks (case-insensitive, accent-insensitive)
const DATE_PATTERNS = [
    "fecha", "f.valor", "fecha valor", "fecha operacion", "fecha operación",
    "f.operacion", "f.operación", "date", "completed date", "fecha contable",
];
const DESCRIPTION_PATTERNS = [
    "concepto", "descripcion", "descripción", "movimiento", "detalle",
    "description", "referencia", "concepto / referencia",
];
const AMOUNT_PATTERNS = [
    "importe", "cantidad", "amount", "monto", "importe (eur)", "importe (€)",
    "importe eur", "saldo", "valor",
];
const DEBIT_PATTERNS = ["cargo", "debe", "debit", "gastos"];
const CREDIT_PATTERNS = ["abono", "haber", "credit", "ingresos"];

function normalize(s: string): string {
    return s.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function matchColumn(headers: string[], patterns: string[]): string | undefined {
    for (const pattern of patterns) {
        const match = headers.find(h => normalize(h) === normalize(pattern));
        if (match) return match;
    }
    // Partial match fallback
    for (const pattern of patterns) {
        const match = headers.find(h => normalize(h).includes(normalize(pattern)));
        if (match) return match;
    }
    return undefined;
}

function parseSpanishAmount(raw: string | undefined | null): number {
    if (!raw) return 0;
    const cleaned = raw.toString().trim().replace(/[€$\s]/g, "");
    if (!cleaned || cleaned === "-") return 0;

    // Spanish format: dots for thousands, comma for decimal (1.234,56)
    if (/\d\.\d{3}/.test(cleaned) && cleaned.includes(",")) {
        return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    }
    // International format: commas for thousands, dot for decimal (1,234.56)
    if (/\d,\d{3}/.test(cleaned) && cleaned.includes(".")) {
        return parseFloat(cleaned.replace(/,/g, ""));
    }
    // Simple comma-as-decimal (no thousands sep): "45,32"
    if (cleaned.includes(",") && !cleaned.includes(".")) {
        return parseFloat(cleaned.replace(",", "."));
    }
    return parseFloat(cleaned) || 0;
}

function parseDate(raw: string | undefined | null): string | null {
    if (!raw) return null;
    const trimmed = raw.toString().trim();
    if (!trimmed) return null;

    // YYYY-MM-DD (already ISO)
    const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy4 = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy4) {
        const [, d, m, y] = dmy4;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // DD/MM/YY
    const dmy2 = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (dmy2) {
        const [, d, m, yy] = dmy2;
        const y = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    return null;
}

function stripBom(text: string): string {
    return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

export function parseBankCsv(csvText: string): CsvParseResult | null {
    const cleaned = stripBom(csvText);
    const warnings: string[] = [];

    const result = Papa.parse(cleaned, {
        header: true,
        skipEmptyLines: "greedy" as any,
        dynamicTyping: false,
    });

    if (!result.meta.fields || result.meta.fields.length < 2) {
        return null;
    }

    const headers = result.meta.fields;
    const rows = result.data as Record<string, string>[];

    if (rows.length === 0) {
        return null;
    }

    // Detect columns
    const dateColumn = matchColumn(headers, DATE_PATTERNS);
    const descriptionColumn = matchColumn(headers, DESCRIPTION_PATTERNS);
    const amountColumn = matchColumn(headers, AMOUNT_PATTERNS);
    const debitColumn = matchColumn(headers, DEBIT_PATTERNS);
    const creditColumn = matchColumn(headers, CREDIT_PATTERNS);

    if (!dateColumn || !descriptionColumn) {
        return null; // Heuristic failed — signal AI fallback needed
    }
    if (!amountColumn && !debitColumn) {
        return null;
    }

    const detectedFormat: DetectedFormat = {
        dateColumn,
        descriptionColumn,
        amountColumn: amountColumn || "",
        debitColumn,
        creditColumn,
    };

    const totalRowsInFile = rows.length;
    const transactions: RawTransaction[] = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const dateRaw = row[dateColumn];
        const date = parseDate(dateRaw);
        if (!date) {
            warnings.push(`Row ${i + 1}: Could not parse date "${dateRaw}"`);
            continue;
        }

        const description = (row[descriptionColumn] || "").trim();
        if (!description) {
            warnings.push(`Row ${i + 1}: Empty description, skipping`);
            continue;
        }

        let amount: number;
        if (amountColumn) {
            amount = parseSpanishAmount(row[amountColumn]);
        } else {
            // Debit/Credit split
            const debit = debitColumn ? parseSpanishAmount(row[debitColumn]) : 0;
            const credit = creditColumn ? parseSpanishAmount(row[creditColumn]) : 0;
            amount = credit > 0 ? credit : -Math.abs(debit);
        }

        transactions.push({ date, description, amount });
    }

    if (transactions.length === 0) {
        return null;
    }

    return { transactions, detectedFormat, totalRowsInFile, warnings };
}

/**
 * Parse with explicit column mapping (used after AI column detection)
 */
export function parseBankCsvWithMapping(
    csvText: string,
    mapping: {
        dateColumn: string;
        descriptionColumn: string;
        amountColumn?: string;
        debitColumn?: string;
        creditColumn?: string;
        dateFormat?: string;
        decimalSeparator?: string;
    }
): CsvParseResult | null {
    const cleaned = stripBom(csvText);
    const warnings: string[] = [];

    const result = Papa.parse(cleaned, {
        header: true,
        skipEmptyLines: "greedy" as any,
        dynamicTyping: false,
    });

    const rows = result.data as Record<string, string>[];
    if (rows.length === 0) return null;

    const totalRowsInFile = rows.length;
    const transactions: RawTransaction[] = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const dateRaw = row[mapping.dateColumn];
        const date = parseDate(dateRaw);
        if (!date) {
            warnings.push(`Row ${i + 1}: Could not parse date "${dateRaw}"`);
            continue;
        }

        const description = (row[mapping.descriptionColumn] || "").trim();
        if (!description) {
            warnings.push(`Row ${i + 1}: Empty description, skipping`);
            continue;
        }

        let amount: number;
        if (mapping.amountColumn) {
            amount = parseSpanishAmount(row[mapping.amountColumn]);
        } else if (mapping.debitColumn) {
            const debit = parseSpanishAmount(row[mapping.debitColumn]);
            const credit = mapping.creditColumn ? parseSpanishAmount(row[mapping.creditColumn]) : 0;
            amount = credit > 0 ? credit : -Math.abs(debit);
        } else {
            amount = 0;
        }

        transactions.push({ date, description, amount });
    }

    if (transactions.length === 0) return null;

    return {
        transactions,
        detectedFormat: {
            dateColumn: mapping.dateColumn,
            descriptionColumn: mapping.descriptionColumn,
            amountColumn: mapping.amountColumn || "",
            debitColumn: mapping.debitColumn,
            creditColumn: mapping.creditColumn,
        },
        totalRowsInFile,
        warnings,
    };
}

/**
 * Convert XLS/XLSX buffer to CSV text for parsing
 */
export function xlsxToCsv(buffer: Buffer): string {
    // Dynamic import to avoid loading xlsx when not needed
    const XLSX = require("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(firstSheet, { FS: ";" });
}
