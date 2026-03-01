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

export interface Tenant {
    name: string;
    avatar?: string;
    contractUntil?: string;
    monthlyRent: number;
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
    rentalYield?: number;
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
    balance: number;
    interestRate: number;
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
    amount: number;
    category: string;
    tags: string[];
    status: TransactionStatus;
    splits?: Split[];
    linkedProjectId?: string;
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
