export type AssetType = "real_estate" | "business";
export type LiabilityType = "mortgage" | "loan";
export type TransactionStatus = "confirmed" | "needs_review";
export type ReserveType = "tax" | "maintenance" | "emergency" | "custom";
export type DocumentCategory = "property" | "legal" | "insurance";
export type ObjectStatus = "active" | "verified" | "pending";

export interface Employee {
    name: string;
    avatar?: string;
}

export interface RentIncrease {
    date: string;
    newRent: number;
}

export interface Tenant {
    _id?: string;
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
    contractStart: string;
    contractEnd?: string;
    monthlyRent: number;
    deposit?: number;
    rentIncreases?: RentIncrease[];
    notes?: string;
}

export interface IAsset {
    _id?: string;
    name: string;
    type: AssetType;
    value: number;
    location?: string;
    purchasePrice?: number;
    purchaseDate?: string;
    area?: number;
    image?: string;
    // Real estate specific
    bedrooms?: number;
    bathrooms?: number;
    hasElevator?: boolean;
    hasParking?: boolean;
    yearBuilt?: number;
    cadastralReference?: string;
    notes?: string;
    rentalYield?: number;
    keywords?: string[];
    // Business specific
    mrr?: number;
    momGrowth?: number;
    employees?: Employee[];
    monthlyPayroll?: number;
    tenants?: Tenant[];
}

export interface ILiability {
    _id?: string;
    name: string;
    type: LiabilityType;
    initialCapital?: number;
    startDate?: string;
    termMonths?: number;
    interestType?: "fixed" | "variable";
    interestRate: number; // Legacy or fallback
    tin?: number;
    tae?: number;
    lateInterestRate?: number;
    amortizationCommission?: number;
    cancellationCommission?: number;
    paymentChargeDay?: number;
    monthlyPayment: number;
    bank: string;
    loanNumber?: string;
    linkedAssetId?: string | IAsset;
}

export interface Split {
    category: string;
    amount: number;
}

export interface ITransaction {
    _id?: string;
    date: string;
    description: string;
    friendlyDescription?: string;
    amount: number;
    category: string;
    tags: string[];
    status: TransactionStatus;
    splits?: Split[];
    linkedProjectId?: string;
    linkedAssetId?: string;
    batchId?: string;
    source: "manual" | "csv_import";
    processingTime?: string;
}

export interface IReserve {
    _id?: string;
    name: string;
    type: ReserveType;
    balance: number;
    target: number;
    dueDate?: string;
    allocationPercent?: number;
    linkedAssetId?: string;
}

export interface Expense {
    concept: string;
    category: string;
    provider: string;
    status: "Pagado" | "Pendiente" | "Depósito";
    amount: number;
}

export interface Note {
    text: string;
    date: string;
    isImportant?: boolean;
}

export interface IProject {
    _id?: string;
    name: string;
    description: string;
    linkedAssetId?: string;
    budget: number;
    actualSpent: number;
    progress: number;
    capitalize: boolean;
    estimatedEnd: string;
    expenses: Expense[];
    notes: Note[];
}

export interface IDocument {
    _id?: string;
    name: string;
    type: DocumentCategory;
    entity: string;
    fileType: string;
    status: ObjectStatus;
    uploadDate: string;
    expirationDate?: string;
    url?: string;
}

// Transaction Stats (server-side aggregation)
export interface ITransactionStats {
    total: number;
    needsReviewCount: number;
    confirmedCount: number;
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
}

export interface IPaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Computed KPIs
export interface IKPIs {
    netWorth: number;
    netWorthGrowth: number;
    ltvRatio: number;
    monthlyFcf: number;
    monthlyFcfGrowth: number;
    fcfIn: number;
    fcfOut: number;
    fiGoalProgress: number;
}

export interface ProviderConfig {
    name: "openai" | "anthropic" | "google";
    apiKey: string;
    model: string;
}

export interface ISettings {
    _id?: string;
    activeProvider: "openai" | "anthropic" | "google";
    providers: ProviderConfig[];
}

// Categories
export interface ICategory {
    _id?: string;
    name: string;
    icon?: string;
    color?: string;
}

// Ingestion Batch (staging for AI-processed transactions)
export type IngestionBatchStatus = "in_review" | "completed";

export interface IStagedTransaction {
    date: string;
    description: string;
    friendlyDescription?: string;
    amount: number;
    category: string;
    linkedAssetId?: string;
    linkedProjectId?: string;
    tags?: string[];
    confirmed: boolean;
    pendingDeletion?: boolean;
    deletionReason?: string;
}

export interface IProcessingStats {
    parseTimeMs: number;
    categorizeTimeMs: number;
    totalChunks: number;
    retriedChunks: number;
    fallbackChunks: number;
}

export interface IIngestionBatch {
    _id?: string;
    fileName?: string;
    transactions: IStagedTransaction[];
    suggestedCategories?: string[];
    totalCount: number;
    confirmedCount: number;
    status: IngestionBatchStatus;
    expiresAt?: Date;
    createdAt?: Date;
    processingStats?: IProcessingStats;
}
